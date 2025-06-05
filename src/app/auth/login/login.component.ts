import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BackendService } from '../../../services/backend.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css', '../auth.styles.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive]
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
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  onInputChange() {
    // Only clear error message if user has attempted to submit before
    if (this.hasAttemptedSubmit) {
      const currentEmail = this.email?.value;
      const currentPassword = this.password?.value;
      
      // Clear error message only if the user has changed the input values
      if (currentEmail !== this.loginForm.value.email || currentPassword !== this.loginForm.value.password) {
        this.errorMessage = '';
      }
    }
  }

  onSubmit() {
    this.hasAttemptedSubmit = true;
    
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = ''; // Clear any previous error messages
      
      const credentials = {
        ...this.loginForm.value
      };

      this.auth.login(credentials).subscribe({
        next: (response) => {
          if (response.token) {
            localStorage.setItem('authToken', response.token);
            if (response.data?.user) {
              localStorage.setItem('userData', JSON.stringify(response.data.user));
              this.successMessage = `Welcome back${response.data.user.username ? ', ' + response.data.user.username : ''}!`;
              
              // Route based on user role
              const targetRoute = response.data.user.role === 'admin' ? '/admin-dashboard' : '/student-home';
              
              // Delay navigation to show success message
              setTimeout(() => {
                this.router.navigate([targetRoute]);
              }, 2000);
            }
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.isSubmitting = false;
          this.errorMessage = error.message || 'Invalid email or password. Please try again.';
          this.loginForm.enable(); // Re-enable the form
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
