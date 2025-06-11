import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BackendService } from '../../../../services/backend.service';
import type { Exam } from '../../../../services/backend.service';

@Component({
  selector: 'app-student-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- Navigation Bar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand">Student Portal</a>
        <button class="btn btn-outline-light" (click)="logout()">Logout</button>
      </div>
    </nav>

    <div class="container mt-4">
      <div class="row">
        <div class="col-12">
          <h2 class="mb-4">Available Exams</h2>
          
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

          <!-- No Exams State -->
          <div *ngIf="!loading && !error && (!exams || exams.length === 0)" class="text-center py-5">
            <h3>No exams available at the moment</h3>
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
                    <span class="badge bg-info">{{ getQuestionCount(exam) }} Questions</span>
                    <button (click)="startExam(exam._id)" class="btn btn-primary">
                      Start Exam
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .navbar {
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
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
    }
    .btn-primary {
      background-color: #3498db;
      border-color: #3498db;
      padding: 0.5rem 1.5rem;
      border-radius: 20px;
    }
    .btn-primary:hover {
      background-color: #2980b9;
      border-color: #2980b9;
    }
    .badge {
      padding: 0.5em 1em;
      font-weight: 500;
    }
  `]
})
export class StudentHomeComponent implements OnInit {
  exams: Exam[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private backendService: BackendService,
    private router: Router
  ) {
    // Prevent going back after logout
    window.history.pushState(null, '', window.location.href);
    window.onpopstate = () => {
      window.history.pushState(null, '', window.location.href);
    };
  }

  ngOnInit() {
    this.loadExams();
  }

  getQuestionCount(exam: Exam): number {
    return exam.questions?.length || 0;
  }

  loadExams() {
    this.loading = true;
    this.error = null;

    this.backendService.getAvailableExams().subscribe({
      next: (response) => {
        this.exams = response.data?.exams || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load exams';
        this.loading = false;
      }
    });
  }

  startExam(examId: string | undefined) {
    if (!examId) {
      this.error = 'Invalid exam selected';
      return;
    }
    this.router.navigate(['/student/exam', examId]);
  }

  logout() {
    this.backendService.logout();
    this.router.navigate(['/login']).then(() => {
      window.location.reload(); // Force reload to clear any cached data
    });
  }
} 