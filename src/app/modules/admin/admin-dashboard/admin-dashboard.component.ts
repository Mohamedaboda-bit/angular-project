import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { BackendService } from '../../../../services/backend.service';
import type { Exam, ApiResponse } from '../../../../services/backend.service';
import { filter, Subscription, fromEvent, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface ExamStats {
  total: number;
  active: number;
  completed: number;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  activeTab = 'current';
  currentExams: Exam[] = [];
  stats: ExamStats = {
    total: 0,
    active: 0,
    completed: 0
  };
  loading = true;
  error: string | null = null;
  private navigationSubscription = new Subscription();
  private popStateSubscription = new Subscription();
  exams: Exam[] = [];
  examResults: any[] = [];
  loadingResults = false;
  profileImageUrl = 'https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cHJvZmlsZXxlbnwwfHwwfHx8MA%3D%3D';

  constructor(
    private router: Router,
    public backendService: BackendService
  ) {
    
    if (!this.backendService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    if (!this.backendService.isAdmin()) {
      this.router.navigate(['/student/home']);
      return;
    }

    
    history.pushState(null, '', window.location.href);
    this.popStateSubscription = fromEvent(window, 'popstate').subscribe(() => {
      history.pushState(null, '', window.location.href);
    });

    
    this.navigationSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.router.url.includes('/admin/dashboard')) {
        this.loadExams();
      }
    });
  }

  ngOnInit() {
    
    if (!this.backendService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    if (!this.backendService.isAdmin()) {
      this.router.navigate(['/student/home']);
      return;
    }

    this.loadExams();
  }

  ngOnDestroy() {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
    if (this.popStateSubscription) {
      this.popStateSubscription.unsubscribe();
    }
  }

  loadExams() {
    this.loading = true;
    this.error = null;
    
    
    if (!this.backendService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.backendService.getAllExamsAdmin().subscribe({
      next: (response) => {
        if (response && response.data?.exams) {
          this.currentExams = response.data.exams;
          this.calculateStats();
          this.loadResults();
        } else {
          this.error = 'Failed to load exams. Please try again.';
        }
        this.loading = false;
      },
      error: (error) => {
        if (error.status === 401) {
          
          this.router.navigate(['/login']);
        } else {
          this.error = error.message || 'An error occurred while loading exams';
        }
        this.loading = false;
      }
    });
  }

  calculateStats() {
    this.stats.total = this.currentExams.length;
    this.stats.active = this.currentExams.filter(exam => exam.isActive).length;
    this.stats.completed = this.currentExams.filter(exam => !exam.isActive).length;
  }

  getInitials(text: string): string {
    return text.split(' ').map(word => word[0]).join('').toUpperCase();
  }

  editExam(exam: Exam): void {
    
    console.log('Edit exam clicked:', {
      examId: exam._id,
      isLoggedIn: this.backendService.isLoggedIn(),
      isAdmin: this.backendService.isAdmin(),
      authToken: localStorage.getItem('authToken'),
      userRole: localStorage.getItem('userRole')
    });

    
    this.router.navigate(['/admin/edit-exam', exam._id]);
  }

  removeExam(exam: Exam): void {
    if (confirm('Are you sure you want to delete this exam?')) {
      this.backendService.deleteExam(exam._id!).subscribe({
        next: () => {
          this.loadExams();
        },
        error: (err) => {
          this.error = err.message || 'Failed to delete exam';
        }
      });
    }
  }

  addNewExam(): void {
    this.router.navigate(['/admin/create-exam']);
  }

  logout() {
    this.backendService.logout();
    this.router.navigate(['/login']).then(() => {
      window.location.reload(); 
    });
  }

  loadResults() {
    if (!this.currentExams.length) {
      this.examResults = [];
      this.stats.completed = 0;
      return;
    }

    this.loadingResults = true;
    
    
    const resultObservables = this.currentExams.map(exam => 
      this.backendService.getResultsForExam(exam._id!).pipe(
        map(response => response.data?.results || []),
        catchError(error => {
          // console.error(`Error loading results for exam ${exam._id}:`, error);
          return of([]); 
        })
      )
    );

    
    forkJoin(resultObservables).subscribe({
      next: (resultsArrays) => {
        
        this.examResults = resultsArrays.flat();
        // console.log(this.examResults);

        this.stats.completed = this.examResults.length;
        this.loadingResults = false;
      },
      error: (err) => {
        // console.error('Error loading results:', err);
        this.loadingResults = false;
      }
    });
  }

  
  navigateToProfile() {
    this.router.navigate(['/admin/profile']);
  }

  handleImageError() {
    const username = this.backendService.getUserData()?.username || 'A';
    this.profileImageUrl = `https://ui-avatars.com/api/?name=${username}&background=random`;
  }

  toggleExamStatus(exam: Exam) {
    const updatedStatus = !exam.isActive;
    this.backendService.updateExam(exam._id!, { isActive: updatedStatus }).subscribe({
      next: (response) => {
        if (response.status === 'success') {
          exam.isActive = updatedStatus;
          this.calculateStats();
        } else {
          this.error = 'Failed to update exam status.';
        }
      },
      error: (err) => {
        this.error = err.message || 'Failed to update exam status.';
      }
    });
  }
}