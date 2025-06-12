import { Routes } from '@angular/router';
import { AuthGuard, AdminGuard, AuthNavigationGuard } from '../services/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [AuthNavigationGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [AuthNavigationGuard] },
  {
    path: 'student',
    canActivate: [AuthGuard],
    loadChildren: () => import('./modules/student/student.module').then(m => m.StudentModule)
  },
  {
    path: 'admin',
    canActivate: [AuthGuard, AdminGuard],
    loadChildren: () => import('./modules/admin/admin.module').then(m => m.AdminModule)
  },
  { path: '**', redirectTo: '/login' } 
];