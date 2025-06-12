import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ExamCreatorComponent } from './pages/exam-creator/exam-creator.component';

const routes: Routes = [
  { 
    path: '',  
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'create-exam', component: ExamCreatorComponent },
      { path: 'edit-exam/:id', component: ExamCreatorComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminModule { } 