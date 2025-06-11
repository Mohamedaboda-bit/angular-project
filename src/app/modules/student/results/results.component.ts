import { Component, OnInit } from '@angular/core';
import { BackendService } from '../../../../services/backend.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.css']
})
export class ResultsComponent implements OnInit {
  results: any[] = [];
  loading = true;
  error: string | null = null;
  profileImageUrl: string = 'https://ui-avatars.com/api/?name=Student&background=0D8ABC&color=fff';

  constructor(private backendService: BackendService, private router: Router) {}

  ngOnInit() {
    this.fetchResults();
  }

  fetchResults() {
    this.loading = true;
    this.error = null;
    this.backendService.getMyResults().subscribe({
      next: (response) => {
        if (response.status === 'success' && response.data?.results) {
          this.results = response.data.results;
        } else {
          this.error = 'Failed to load results.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'An error occurred while loading results.';
        this.loading = false;
      }
    });
  }

  logout = () => {
    this.backendService.logout();
    this.router.navigate(['/login']);
  }
}
