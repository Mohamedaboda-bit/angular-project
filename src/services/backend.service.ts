import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CanActivate, Router } from '@angular/router';

interface AuthResponse {
  status: string;
  token: string;
  data: { 
    user: {
      id: string;
      email: string;
      username?: string;
      role: 'admin' | 'user';
    } 
  };
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface ApiResponse {
  status: string;
  message?: string;
  data?: any;
  results?: number;
}

interface Question {
  _id?: string; 
  text: string;
  options: string[];
  correctAnswer?: string; 
}

interface Exam {
  _id?: string;
  title: string;
  description?: string;
  questions: Question[];
  isActive?: boolean;
  createdBy?: any; 
  createdAt?: Date;
  updatedAt?: Date;
}

interface Result {
  _id?: string;
  student?: any; 
  exam?: any; 
  answers?: any[]; 
  score?: number;
  totalQuestions?: number;
  percentage?: number;
  createdAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private apiUrl = 'http://localhost:3000/api/v1'; 

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken'); 
    if (!token) {
      console.error('Auth token not found!');
      return new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      if (error.status === 401) {
        errorMessage = 'Invalid credentials. Please check your email and password.';
      } else if (error.status === 403) {
        errorMessage = 'Access denied. You do not have permission to perform this action.';
      } else if (error.status === 404) {
        errorMessage = 'User not found. Please check your credentials.';
      } else if (error.status === 409) {
        errorMessage = 'This email is already registered. Please try logging in.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  register(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, userData)
      .pipe(
        tap(response => {
          if (response.data?.user) {
            localStorage.setItem('userRole', response.data.user.role);
          }
        }),
        catchError(this.handleError)
      );
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.data?.user) {
            localStorage.setItem('userRole', response.data.user.role);
            localStorage.setItem('userData', JSON.stringify(response.data.user));
          }
        }),
        catchError(this.handleError)
      );
  }

  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  isAdmin(): boolean {
    return localStorage.getItem('userRole') === 'admin';
  }

  getAvailableExams(): Observable<ApiResponse> { 
    return this.http.get<ApiResponse>(`${this.apiUrl}/exams/available`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getExamForTaking(examId: string): Observable<ApiResponse> { 
    return this.http.get<ApiResponse>(`${this.apiUrl}/exams/${examId}/take`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  createExam(examData: Partial<Exam>): Observable<ApiResponse> { 
    return this.http.post<ApiResponse>(`${this.apiUrl}/exams`, examData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getAllExamsAdmin(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/exams`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getExamAdmin(examId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/exams/${examId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateExam(examId: string, examData: Partial<Exam>): Observable<ApiResponse> { 
    return this.http.patch<ApiResponse>(`${this.apiUrl}/exams/${examId}`, examData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteExam(examId: string): Observable<ApiResponse> { 
    return this.http.delete<ApiResponse>(`${this.apiUrl}/exams/${examId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  addQuestion(examId: string, questionData: Question): Observable<ApiResponse> { 
    return this.http.post<ApiResponse>(`${this.apiUrl}/exams/${examId}/questions`, questionData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  updateQuestion(examId: string, questionId: string, questionData: Partial<Question>): Observable<ApiResponse> { 
    return this.http.patch<ApiResponse>(`${this.apiUrl}/exams/${examId}/questions/${questionId}`, questionData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  deleteQuestion(examId: string, questionId: string): Observable<ApiResponse> { 
    return this.http.delete<ApiResponse>(`${this.apiUrl}/exams/${examId}/questions/${questionId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  submitExam(submissionData: { examId: string, answers: { questionId: string, selectedOption: string }[] }): Observable<ApiResponse> { 
    return this.http.post<ApiResponse>(`${this.apiUrl}/results/submit`, submissionData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getMyResults(): Observable<ApiResponse> { 
    return this.http.get<ApiResponse>(`${this.apiUrl}/results/my`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getMyResultDetails(resultId: string): Observable<ApiResponse> { 
    return this.http.get<ApiResponse>(`${this.apiUrl}/results/my/${resultId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getResultsForExam(examId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/results/exam/${examId}`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getResultDetailsAdmin(resultId: string): Observable<ApiResponse> { 
    return this.http.get<ApiResponse>(`${this.apiUrl}/results/${resultId}/details`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

}

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private backendService: BackendService, private router: Router) {}

  canActivate(): boolean {
    if (this.backendService.isAdmin()) {
      return true;
    } else {
      this.router.navigate(['/student-home']);
      return false;
    }
  }
}

