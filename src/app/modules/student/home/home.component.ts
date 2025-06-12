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
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class StudentHomeComponent implements OnInit, OnDestroy {
  private popStateSubscription = new Subscription();
  exams: Exam[] = [];
  loading = false;
  error: string | null = null;

  profileImageUrl: string = 'https://ui-avatars.com/api/?name=Student&background=0D8ABC&color=fff';

  constructor(
    public backendService: BackendService,
    private router: Router
  ) {
    
    if (!this.backendService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    
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
          this.exams = response.data.exams
          // console.log(this.exams);
        } else {
          this.error = 'Failed to load exams. Please try again.';
        }
        this.loading = false;
      },
      error: (error: any) => {
        // console.error('Error loading exams:', error);
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

  
  navigateToProfile() {
    this.router.navigate(['/student/profile']);
  }

  logout() {
    this.backendService.logout();
    this.router.navigate(['/login']);
  }

  handleImageError() {
    this.profileImageUrl = 'https://ui-avatars.com/api/?name=Student&background=0D8ABC&color=fff';
  }
} 