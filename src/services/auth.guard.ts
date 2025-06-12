import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { BackendService } from './backend.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private backendService: BackendService, private router: Router) {}

  canActivate(): boolean {
    if (this.backendService.isLoggedIn()) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthNavigationGuard implements CanActivate {
  constructor(
    private backendService: BackendService,
    private router: Router
  ) {}

  canActivate(): boolean {
    
    if (this.backendService.isLoggedIn()) {
      const userData = this.backendService.getUserData();
      if (userData?.role === 'admin') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/student/home']);
      }
      return false;
    }
    return true;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private backendService: BackendService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (!this.backendService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return false;
    }
    
    if (!this.backendService.isAdmin()) {
      this.router.navigate(['/student/home']);
      return false;
    }
    
    return true;
  }
} 