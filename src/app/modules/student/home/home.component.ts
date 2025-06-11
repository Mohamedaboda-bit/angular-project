import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BackendService } from '../../../../services/backend.service';
import type { Exam } from '../../../../services/backend.service';
import { fromEvent, Subscription } from 'rxjs';

@Component({
  selector: 'app-student-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container py-5">
      <h1 class="mb-4">Available Exams</h1>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && !error && (!exams || exams.length === 0)" class="text-center py-5">
        <h3 class="text-muted">No exams available at the moment</h3>
        <p class="text-muted">Please check back later for new exams</p>
      </div>

      <!-- Exams Grid -->
      <div *ngIf="!loading && !error && exams && exams.length > 0" class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        <div *ngFor="let exam of exams" class="col">
          <div class="card h-100 shadow-sm">
            <div class="card-body">
              <h5 class="card-title">{{ exam.title }}</h5>
              <p class="card-text">{{ exam.description || 'No description available' }}</p>
              <div class="d-flex justify-content-between align-items-center">
                <span class="badge bg-info">{{ exam.questions.length }} Questions</span>
                <button (click)="startExam(exam._id)" class="btn btn-primary">
                  Start Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      transition: transform 0.2s;
      border: none;
      border-radius: 10px;
    }
    .card:hover {
      transform: translateY(-5px);
    }
    .card-title {
      color: #2c3e50;
      font-weight: 600;
    }
    .card-text {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
    .btn-primary {
      background-color: #3498db;
      border-color: #3498db;
    }
    .btn-primary:hover {
      background-color: #2980b9;
      border-color: #2980b9;
    }
    .badge {
      font-size: 0.9rem;
      padding: 0.5rem 0.7rem;
    }
  `]
})
export class StudentHomeComponent implements OnInit, OnDestroy {
  private popStateSubscription = new Subscription();
  exams: Exam[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    public backendService: BackendService,
    private router: Router
  ) {
    // Check authentication
    if (!this.backendService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    // Prevent browser back/forward navigation
    history.pushState(null, '', window.location.href);
    this.popStateSubscription = fromEvent(window, 'popstate').subscribe(() => {
      history.pushState(null, '', window.location.href);
    });
  }

  ngOnInit() {
    if (!this.backendService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadExams();
  }

  ngOnDestroy() {
    if (this.popStateSubscription) {
      this.popStateSubscription.unsubscribe();
    }
  }

  loadExams() {
    this.loading = true;
    this.error = null;

    this.backendService.getAvailableExams().subscribe({
      next: (response: any) => {
        if (response && response.status === 'success' && response.data?.exams) {
          this.exams = response.data.exams.filter((exam: Exam) => exam.isActive);
        } else {
          this.error = 'Failed to load exams. Please try again.';
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading exams:', error);
        this.error = error.message || 'An error occurred while loading exams';
        this.loading = false;
      }
    });
  }

  startExam(examId: string | undefined) {
    if (examId) {
      this.router.navigate(['/student/exam', examId]);
    }
  }

  // Add method to handle profile navigation
  navigateToProfile() {
    this.router.navigate(['/student/profile']);
  }

  logout() {
    this.backendService.logout();
    this.router.navigate(['/login']);
  }
} 