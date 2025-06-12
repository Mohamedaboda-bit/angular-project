import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { BackendService } from '../../../services/backend.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['../auth.styles.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive]
})
export class RegisterComponent {
  registerForm: FormGroup;
  errorMessage: string = '';
  isSubmitting: boolean = false;
  private hasAttemptedSubmit: boolean = false;

  constructor(
    private fb: FormBuilder,
    private auth: BackendService,
    private router: Router
  ) {
    this.registerForm = this.fb.nonNullable.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern('^[a-zA-Z0-9_-]*$')
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        this.passwordStrengthValidator
      ]],
      passwordConfirm: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });

    
    this.registerForm.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = '';
      }
    });
  }

  
  get username() { return this.registerForm.get('username')!; }
  get email() { return this.registerForm.get('email')!; }
  get password() { return this.registerForm.get('password')!; }
  get passwordConfirm() { return this.registerForm.get('passwordConfirm')!; }

  onInputChange() {
    if (this.hasAttemptedSubmit && this.errorMessage) {
      this.errorMessage = '';
    }
  }

  passwordMatchValidator(form: AbstractControl): ValidationErrors | null {
    const password = form.get('password');
    const passwordConfirm = form.get('passwordConfirm');
    
    if (password && passwordConfirm && password.value !== passwordConfirm.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  passwordStrengthValidator(control: AbstractControl): {[key: string]: boolean} | null {
    const password = control.value;
    if (!password) return null;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const valid = hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
    
    return valid ? null : { passwordStrength: true };
  }

  onSubmit() {
    this.hasAttemptedSubmit = true;
  
    if (this.registerForm.valid) {
      this.isSubmitting = true;
      const { passwordConfirm, ...registrationData } = this.registerForm.value;
  
      this.auth.register(registrationData).subscribe({
        next: (response) => {
          localStorage.setItem('authToken', response.token);
          if (response.data?.user) {
            localStorage.setItem('userData', JSON.stringify(response.data.user));
          }
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.message || 'Registration failed. Please try again.';
          // console.error('Registration failed:', error);
        }
      });
    } else {
      Object.values(this.registerForm.controls).forEach(control => {
        control.markAsTouched();
      });
    }
  }
  
}
