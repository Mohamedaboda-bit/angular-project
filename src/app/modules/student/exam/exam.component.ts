import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BackendService, AppError } from '../../../../services/backend.service';
import type { Exam } from '../../../../services/backend.service';
import { catchError, retry, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface ExamFormAnswer {
  selectedAnswer: string;
}

interface ExamFormGroup {
  answers: ExamFormAnswer[];
}

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="container py-4">
      <div *ngIf="loading" class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div *ngIf="error" class="alert alert-danger">
        {{ error }}
      </div>

      <div *ngIf="exam && !loading">
        <h1 class="mb-4">{{ exam.title }}</h1>
        <p class="lead mb-4">{{ exam.description }}</p>

        <form [formGroup]="examForm" (ngSubmit)="onSubmit()">
          <div formArrayName="answers">
            <div *ngFor="let question of exam.questions; let i = index" class="card mb-4">
              <div class="card-body">
                <h5 class="card-title">Question {{ i + 1 }}</h5>
                <p class="card-text">{{ question.text }}</p>

                <div [formGroupName]="i">
                  <div class="form-check" *ngFor="let option of question.options; let j = index">
                    <input class="form-check-input" 
                           type="radio" 
                           [id]="'q'+i+'opt'+j"
                           [value]="j.toString()"
                           formControlName="selectedAnswer">
                    <label class="form-check-label" [for]="'q'+i+'opt'+j">
                      {{ option }}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="d-grid gap-2">
            <button type="submit" 
                    class="btn btn-primary btn-lg"
                    [disabled]="!examForm.valid || submitting">
              {{ submitting ? 'Submitting...' : 'Submit Exam' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-check {
      margin-bottom: 0.5rem;
    }
    .card {
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .card-body {
      padding: 2rem;
    }
  `]
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
    this.error = null; // Clear any previous errors
    
    console.log('Form value:', this.examForm.value);
    console.log('Exam questions:', this.exam.questions);

    const answers = this.examForm.value.answers?.map((a: any, index: number) => {
      const question = this.exam!.questions[index];
      const selectedOptionIndex = parseInt(a.selectedAnswer);
      
      // Skip questions without an ID
      if (!question._id) {
        console.error('Question missing ID:', question);
        return null;
      }
      
      console.log('Question:', question);
      console.log('Selected answer index:', selectedOptionIndex);
      
      return {
        questionId: question._id,
        selectedAnswer: selectedOptionIndex
      };
    }).filter((answer): answer is { questionId: string; selectedAnswer: number } => answer !== null) || [];

    const payload = {
      examId: this.exam._id!,
      answers: answers
    };

    console.log('Final answers payload:', payload);

    this.backendService.submitExam(payload).pipe(
      retry(2), // Retry failed requests up to 2 times
      catchError(error => {
        console.error('Submit error:', error);
        // Return a new observable with the error
        return of({ status: 'error', message: error instanceof AppError ? error.message : 'Unknown error occurred' });
      }),
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe({
      next: (response: any) => {
        console.log('Submit response:', response);
        if (response.status === 'success') {
          // Navigate to results page or show success message
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
} 