import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService, AppError } from '../../../../services/backend.service';
import type { Exam } from '../../../../services/backend.service';
import { catchError, retry, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { NavbarComponent } from '../navbar/navbar.component';

interface ExamFormAnswer {
  selectedAnswer: string;
}

interface ExamFormGroup {
  answers: ExamFormAnswer[];
}

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './exam.component.html',
  styleUrls: ['./exam.component.css']
})
export class ExamComponent implements OnInit {
  exam: Exam | null = null;
  examForm: FormGroup<{
    answers: FormArray<FormGroup<{
      selectedAnswer: FormControl<string | null>;
    }>>;
  }>;
  loading = true;
  error: string | null = null;
  submitting = false;
  profileImageUrl: string = 'https://ui-avatars.com/api/?name=Student&background=0D8ABC&color=fff';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private backendService: BackendService
  ) {
    this.examForm = this.fb.group({
      answers: this.fb.array<FormGroup>([])
    });
  }

  ngOnInit() {
    const examId = this.route.snapshot.params['id'];
    if (!examId) {
      this.error = 'No exam ID provided';
      this.loading = false;
      return;
    }

    this.backendService.getExamForTaking(examId).subscribe({
      next: (response) => {
        if (response.data?.exam) {
          this.exam = response.data.exam;
          this.initForm();
        } else {
          this.error = 'Failed to load exam';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err instanceof AppError ? err.message : 'Failed to load exam: Unknown error';
        this.loading = false;
      }
    });
  }

  private initForm() {
    if (!this.exam) return;

    const answersArray = this.fb.array(
      this.exam.questions.map(() => 
        this.fb.group({
          selectedAnswer: ['', Validators.required]
        })
      )
    );
    
    this.examForm.setControl('answers', answersArray);
  }

  onSubmit() {
    if (this.examForm.invalid || !this.exam) return;

    this.submitting = true;
    this.error = null; 
    
    // console.log('Form value:', this.examForm.value);
    // console.log('Exam questions:', this.exam.questions);

    const answers = this.examForm.value.answers?.map((a: any, index: number) => {
      const question = this.exam!.questions[index];
      const selectedOptionIndex = parseInt(a.selectedAnswer);
      
      
      if (!question._id) {
        // console.error('Question missing ID:', question);
        return null;
      }
      
      // console.log('Question:', question);
      // console.log('Selected answer index:', selectedOptionIndex);
      
      return {
        questionId: question._id,
        selectedOption: question.options[selectedOptionIndex]
      };
    }).filter((answer): answer is { questionId: string; selectedOption: string } => answer !== null) || [];

    const payload = {
      examId: this.exam._id!,
      answers: answers
    };

    // console.log('Final answers payload:', payload);

    this.backendService.submitExam(payload).pipe(
      retry(2), 
      catchError(error => {
        // // console.error('Submit error:', error);
        
        return of({ status: 'error', message: error instanceof AppError ? error.message : 'Unknown error occurred' });
      }),
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe({
      next: (response: any) => {
        // console.log('Submit response:', response);
        if (response.status === 'success') {
          
          this.router.navigate(['/student/results']);
        } else {
          this.error = response.message || 'Failed to submit exam';
        }
      },
      error: (error) => {
        console.error('Submit error:', error);
        this.error = error instanceof AppError ? error.message : 'An unknown error occurred';
      }
    });
  }

  logout = () => {
    this.backendService.logout();
    this.router.navigate(['/login']);
  }
} 