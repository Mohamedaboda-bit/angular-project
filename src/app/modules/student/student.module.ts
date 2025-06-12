import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { StudentHomeComponent } from './home/home';
import { ExamComponent } from './exam/exam.component';
import { AuthGuard } from '../../../services/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: StudentHomeComponent },
  { path: 'exam/:id', component: ExamComponent }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    StudentHomeComponent,
    ExamComponent
  ],
  exports: [RouterModule]
})
export class StudentModule { }