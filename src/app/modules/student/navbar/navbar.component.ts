import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  @Input() profileImageUrl: string = 'https://ui-avatars.com/api/?name=Student&background=0D8ABC&color=fff';

  constructor(private router: Router) {}

  handleImageError() {
    this.profileImageUrl = 'https://ui-avatars.com/api/?name=Student&background=0D8ABC&color=fff';
  }

  navigateToProfile() {
    this.router.navigate(['/student/profile']);
  }

  goToResults() {
    this.router.navigate(['/student/results']);
  }

  @Input() logout!: () => void;
} 