import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [NavbarComponent, RouterOutlet],
  template: `
    <app-student-navbar [profileImageUrl]="profileImageUrl" [logout]="logout"></app-student-navbar>
    <router-outlet></router-outlet>
  `
})
export class StudentLayoutComponent {
  profileImageUrl: string = 'https://ui-avatars.com/api/?name=Student&background=0D8ABC&color=fff';

  constructor(private router: Router) {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      if (user.username) {
        this.profileImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=0D8ABC&color=fff`;
      }
    }
  }

  logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    this.router.navigate(['/login']);
  }
} 