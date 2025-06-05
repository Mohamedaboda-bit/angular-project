import { Routes } from '@angular/router';
import { DashboardComponent } from './modules/student/home/home';
import { AdminDashboardComponent } from './modules/admin/admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: '',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'student-home',
    component: DashboardComponent
  },
  {
    path: 'admin-dashboard',
    component: AdminDashboardComponent
  }
];