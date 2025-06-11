import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BackendService } from '../../../services/backend.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css', '../auth.styles.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink]
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isSubmitting: boolean = false;
  private hasAttemptedSubmit: boolean = false;

  constructor(
    private fb: FormBuilder,
    private auth: BackendService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]]
    });
  }

  // Getter methods for easy access in template
  get email() { return this.loginForm.get('email')!; }
  get password() { return this.loginForm.get('password')!; }

  onInputChange() {
    if (this.hasAttemptedSubmit) {
      this.errorMessage = '';
    }
  }

  onSubmit() {
    this.hasAttemptedSubmit = true;
  
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
  
      const credentials = { ...this.loginForm.value };
  
      this.auth.login(credentials).subscribe({
        next: (response) => {
          if (response && response.token && response.data?.user) {
            const token = response.token.startsWith('Bearer ') ? response.token : `Bearer ${response.token}`;
            localStorage.setItem('authToken', token);
            localStorage.setItem('userData', JSON.stringify(response.data.user));
            localStorage.setItem('userRole', response.data.user.role);
  
            this.successMessage = `Welcome back${response.data.user.username ? ', ' + response.data.user.username : ''}!`;
  
            const targetRoute = response.data.user.role === 'admin' ? '/admin/dashboard' : '/student/home';
  
            setTimeout(() => {
              this.router.navigate([targetRoute]);
            }, 1000);
          } else {
            this.errorMessage = 'Invalid response from server';
            this.isSubmitting = false;
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.isSubmitting = false;
          this.errorMessage = 'Invalid email or password. Please try again.';
          this.loginForm.enable();
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      // Mark all controls as touched to show validation errors
      Object.values(this.loginForm.controls).forEach(control => {
        control.markAsTouched();
      });
    }
  }
  
}
