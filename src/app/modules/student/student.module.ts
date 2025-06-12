import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { StudentHomeComponent } from './home/home.component';
import { ExamComponent } from './exam/exam.component';
import { AuthGuard } from '../../../services/auth.guard';
import { ResultsComponent } from './results/results.component';
import { StudentLayoutComponent } from './student-layout.component';

const routes: Routes = [
  {
    path: '',
    component: StudentLayoutComponent,
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: StudentHomeComponent },
      { path: 'exam/:id', component: ExamComponent },
      { path: 'results', component: ResultsComponent }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    StudentHomeComponent,
    ExamComponent,
    ResultsComponent,
    StudentLayoutComponent
  ],
  exports: [RouterModule]
})
export class StudentModule { }