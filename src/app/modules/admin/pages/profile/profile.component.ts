import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class ProfileComponent {
  adminProfile = {
    name: 'Ahmed Mohamed',
    role: 'Administrator',
    email: 'ahmed.mohamed@example.com',
    joinDate: '2024-01-01',
    profileImage: '../../../../assets/profile.jpg'
  };
} 