import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators, AbstractControl, FormControl } from '@angular/forms';
import { BackendService } from '../../../../../services/backend.service';
import type { Exam, Question, ApiResponse } from '../../../../../services/backend.service';
import { Observable, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-exam-creator',
  templateUrl: './exam-creator.component.html',
  styleUrls: ['./exam-creator.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule]
})
export class ExamCreatorComponent implements OnInit {
  examForm: FormGroup;
  loading = false;
  error: string | null = null;
  isEditMode = false;
  examId: string | null = null;

  constructor(
    private fb: FormBuilder, 
    private backendService: BackendService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.examForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      questions: this.fb.array([])
    });
  }

  ngOnInit() {
    // Check if we're in edit mode by looking for an exam ID in the route
    this.route.params.subscribe(params => {
      console.log('ExamCreator - Route params:', params); // Debug log
      const id = params['id'];
      if (id) {
        console.log('ExamCreator - Found exam ID in route:', id); // Debug log
        console.log('ExamCreator - Auth state:', {
          isLoggedIn: this.backendService.isLoggedIn(),
          isAdmin: this.backendService.isAdmin(),
          authToken: localStorage.getItem('authToken'),
          userRole: localStorage.getItem('userRole')
        });
        this.isEditMode = true;
        this.examId = id;
        this.loadExam(id);
      }
    });
  }

  loadExam(examId: string) {
    this.loading = true;
    this.error = null;
    console.log('Loading exam with ID:', examId); // Debug log

    this.backendService.getExamAdmin(examId).subscribe({
      next: (response: ApiResponse) => {
        console.log('Exam response:', response); // Debug log
        if (response.status === 'success' && response.data?.exam) {
          const exam = response.data.exam;
          
          // Reset form with existing exam data
          this.examForm.patchValue({
            title: exam.title,
            description: exam.description
          });

          // Clear existing questions array
          while (this.questions.length) {
            this.questions.removeAt(0);
          }

          // Add each question from the exam
          exam.questions?.forEach((question: Question) => {
            const questionForm = this.fb.group({
              _id: [question._id || null],
              text: [question.text, Validators.required],
              options: this.fb.array([]),
              correctAnswer: [question.correctAnswer || '0', Validators.required]  // Default to first option if not set
            });

            // Add options to the question
            const optionsArray = questionForm.get('options') as FormArray;
            question.options.forEach((option: string) => {
              optionsArray.push(this.fb.control(option, Validators.required));
            });

            this.questions.push(questionForm);
          });
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading exam:', error);
        this.error = error.message || 'An error occurred while loading the exam';
        this.loading = false;
      }
    });
  }

  get questions() {
    return this.examForm.get('questions') as FormArray;
  }

  getOptionsControls(questionControl: AbstractControl) {
    return (questionControl.get('options') as FormArray).controls;
  }

  getCorrectAnswerControl(questionControl: AbstractControl): FormControl {
    return questionControl.get('correctAnswer') as FormControl;
  }

  addQuestion() {
    const questionForm = this.fb.group({
      _id: [null],
      text: ['', Validators.required],
      options: this.fb.array([
        this.fb.control('', Validators.required),
        this.fb.control('', Validators.required)
      ]),
      correctAnswer: [0, Validators.required]
    });

    this.questions.push(questionForm);
  }

  addOption(questionIndex: number) {
    const options = this.questions.at(questionIndex).get('options') as FormArray;
    options.push(this.fb.control('', Validators.required));
  }

  removeOption(questionIndex: number, optionIndex: number) {
    const options = this.questions.at(questionIndex).get('options') as FormArray;
    options.removeAt(optionIndex);
  }

  removeQuestion(questionIndex: number) {
    // Count how many questions will remain with _id after removal
    const questionsAfterRemoval = this.questions.controls
      .filter((q, idx) => idx !== questionIndex && q.value._id);
    if (questionsAfterRemoval.length === 0) {
      this.error = 'An exam must have at least one saved question.';
      return;
    }
    const examId = this.examId;
    if (!examId) {
      this.error = 'Exam ID is missing.';
      return;
    }
    const questionControl = this.questions.at(questionIndex);
    const questionId = questionControl.value._id;
    if (!questionId) {
      // If question is not yet saved in backend, just remove from form
      this.questions.removeAt(questionIndex);
      return;
    }
    this.loading = true;
    this.backendService.deleteQuestion(examId, questionId).subscribe({
      next: () => {
        this.questions.removeAt(questionIndex);
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to delete question.';
        this.loading = false;
      }
    });
  }

  onSubmit() {
    if (this.examForm.valid) {
      this.loading = true;
      this.error = null;

      const examData: Partial<Exam> = {
        title: this.examForm.value.title,
        description: this.examForm.value.description,
        questions: this.examForm.value.questions.map((q: any) => ({
          text: q.text,
          options: q.options.filter((opt: string) => opt.trim() !== ''),
          correctAnswer: q.options[q.correctAnswer],  // Use the value, not the index
        })),
        isActive: true // Make exam active by default
      };

      console.log('Submitting exam data:', { 
        isEditMode: this.isEditMode, 
        examId: this.examId, 
        examData: JSON.stringify(examData, null, 2)
      }); // Debug log

      let request: Observable<ApiResponse>;
      if (this.isEditMode && this.examId) {
        console.log('Updating exam with ID:', this.examId); // Debug log
        request = this.backendService.updateExam(this.examId, examData);
      } else {
        console.log('Creating new exam'); // Debug log
        request = this.backendService.createExam(examData);
      }

      request.subscribe({
        next: (response: ApiResponse) => {
          console.log('Save response:', response); // Debug log
          if (response.status === 'success') {
            // Get the created/updated exam ID
            const examId = this.isEditMode ? this.examId : response.data?.exam?._id;
            if (examId) {
              // Handle questions: add new and update existing
              const questionRequests = this.questions.controls.map((questionControl) => {
                const q = questionControl.value;
                const questionData = {
                  text: q.text,
                  options: q.options,
                  correctAnswer: q.options[q.correctAnswer] // Use the value, not the index
                };
                if (!q._id) {
                  // New question: add to backend
                  return this.backendService.addQuestion(examId, questionData);
                } else {
                  // Existing question: update in backend
                  return this.backendService.updateQuestion(examId, q._id, questionData);
                }
              });
              if (questionRequests.length > 0) {
                forkJoin(questionRequests).subscribe({
                  next: () => {
                    this.router.navigate(['/admin/dashboard']).then(() => {
                      this.error = null;
                      this.loading = false;
                    });
                  },
                  error: (err) => {
                    this.error = err.message || 'Failed to save questions.';
                    this.loading = false;
                  }
                });
              } else {
                this.router.navigate(['/admin/dashboard']).then(() => {
                  this.error = null;
                  this.loading = false;
                });
              }
            } else {
              this.router.navigate(['/admin/dashboard']).then(() => {
                this.error = null;
                this.loading = false;
              });
            }
          } else {
            this.error = 'Failed to save exam. Please try again.';
            this.loading = false;
          }
        },
        error: (error: any) => {
          console.error('Error saving exam:', error);
          this.error = error.message || 'An error occurred while saving the exam';
          this.loading = false;
        }
      });
    } else {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.examForm.controls).forEach(key => {
        const control = this.examForm.get(key);
        control?.markAsTouched();
      });
      // For the questions form array
      const questions = this.examForm.get('questions') as FormArray;
      questions.controls.forEach(question => {
        Object.keys(question.value).forEach(key => {
          const control = question.get(key);
          control?.markAsTouched();
        });
      });
    }
  }
  
} 