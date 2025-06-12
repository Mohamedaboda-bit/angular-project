import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { CanActivate, Router } from '@angular/router';


export class AppError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'AppError';
  }
}

export interface AuthResponse {
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

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse {
  status: string;
  message?: string;
  data?: {
    exam?: Exam;
    exams?: Exam[];
    token?: string;
    user?: any;
    results?: Result[];
  };
  results?: number;
}

export interface Question {
  _id?: string; 
  text: string;
  options: string[];
  correctAnswer?: string; 
}

export interface Exam {
  _id?: string;
  title: string;
  description?: string;
  questions: Question[];
  isActive?: boolean;
  createdBy?: any; 
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Result {
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
    // console.log('Current auth token:', token); 
    
    if (!token) {
      // console.error('Auth token not found!');
      return new HttpHeaders({ 'Content-Type': 'application/json' });
    }

    
    const finalToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    // console.log('Using token:', finalToken); 
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': finalToken
    });
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    let status = error.status;
    
    
    console.error('Full error details:', {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      error: error.error,
      message: error.message
    });

    if (error.error instanceof ErrorEvent) {
      
      errorMessage = error.error.message;
    } else {
      
      if (error.status === 401) {
        errorMessage = 'Invalid credentials or session expired. Please log in again.';
      } else if (error.status === 403) {
        errorMessage = 'Access denied. You do not have permission to perform this action.';
      } else if (error.status === 404) {
        if (error.url?.includes('/auth/')) {
          errorMessage = 'User not found. Please check your credentials.';
        } else if (error.url?.includes('/exams/')) {
          errorMessage = 'Exam not found. It may have been deleted or you may not have access to it.';
        } else {
          errorMessage = 'Resource not found.';
        }
      } else if (error.status === 409) {
        errorMessage = 'This exam has already been submitted';
      } else if (error.status === 500) {
        
        if (error.error?.message) {
          errorMessage = `Server error: ${error.error.message}`;
        } else if (error.error?.error?.message) {
          errorMessage = `Server error: ${error.error.error.message}`;
        } else {
          errorMessage = 'An internal server error occurred. Please try again later.';
        }
      } else if (error.error?.message?.includes('duplicate key error')) {
        if (error.error.message.includes('title_1')) {
          errorMessage = 'An exam with this title already exists. Please choose a different title.';
        } else {
          errorMessage = 'A duplicate entry was found. Please check your input.';
        }
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      }
    }
    
    return throwError(() => new AppError(errorMessage, status));
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
          if (response.token) {
            const token = response.token.startsWith('Bearer ') ? response.token : `Bearer ${response.token}`;
            localStorage.setItem('authToken', token);
          }
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
    
    
    if (window.history && window.history.pushState) {
      window.history.pushState(null, '', window.location.href);
      window.history.replaceState(null, '', window.location.href);
    }
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

  submitExam(submissionData: { 
    examId: string, 
    answers: { 
      questionId: string, 
      selectedOption: string 
    }[] 
  }): Observable<ApiResponse> { 
    
    // console.log('Submitting exam with data:', JSON.stringify(submissionData, null, 2));

    return this.http.post<ApiResponse>(
      `${this.apiUrl}/results/submit`, 
      submissionData, 
      { 
        headers: this.getAuthHeaders(),
        
        observe: 'response'
      }
    ).pipe(
      map(response => response.body as ApiResponse),
      catchError(error => {
        
        console.error('Submit exam error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          headers: error.headers?.keys(),
          error: error.error,
          message: error.message
        });

        
        if (error.status === 400) {
          return throwError(() => new AppError('Invalid exam submission. Please check your answers and try again.', error.status));
        }
        
        
        if (error.status === 404) {
          return throwError(() => new AppError('Exam not found or no longer available.', error.status));
        }

        
        if (error.status === 500) {
          const serverError = error.error?.message || error.error?.error?.message || 'An internal server error occurred';
          return throwError(() => new AppError(`Server error: ${serverError}`, error.status));
        }

        return this.handleError(error);
      })
    );
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

  getExamResults(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/results`, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  getUserData(): any {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

}

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private backendService: BackendService, private router: Router) {}

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

