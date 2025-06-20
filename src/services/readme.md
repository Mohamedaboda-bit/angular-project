

This document provides documentation for the methods available in the `BackendService` Angular service, which interacts with the Exam System backend API.

**Base API URL:** `http:

---





*   **Purpose:** Creates HttpHeaders with the Authorization token if available.
*   **Details:** Retrieves the token from `localStorage.getItem("authToken")`. You may need to adjust this based on your token storage strategy.
*   **Returns:** `HttpHeaders` object, potentially including the `Authorization: Bearer <token>` header.



*   **Purpose:** Handles HTTP errors from API calls.
*   **Details:** Logs the error to the console and returns an observable error suitable for RxJS `catchError`.
*   **Parameters:**
    *   `error`: `HttpErrorResponse` - The error object received from HttpClient.
*   **Returns:** An `Observable` that throws an `Error`.

---





*   **Purpose:** Registers a new student user.
*   **Endpoint:** `POST /api/v1/auth/register`
*   **Parameters:**
    *   `userData`: `any` - Object containing user registration details (e.g., `{ username, email, password }`).
*   **Returns:** `Observable<AuthResponse>` - An observable containing the API response, including the JWT token and user data upon successful registration.



*   **Purpose:** Logs in a user (student or admin).
*   **Endpoint:** `POST /api/v1/auth/login`
*   **Parameters:**
    *   `credentials`: `any` - Object containing user login credentials (e.g., `{ email, password }`).
*   **Returns:** `Observable<AuthResponse>` - An observable containing the API response, including the JWT token and user data upon successful login.

---





*   **Purpose:** Fetches a list of currently active exams available for students.
*   **Endpoint:** `GET /api/v1/exams/available`
*   **Authentication:** Required (Bearer Token).
*   **Returns:** `Observable<ApiResponse>` - An observable containing the API response with a list of exams (`data.exams`).



*   **Purpose:** Fetches the details of a specific active exam for a student to take (excludes correct answers).
*   **Endpoint:** `GET /api/v1/exams/:id/take`
*   **Authentication:** Required (Bearer Token).
*   **Parameters:**
    *   `examId`: `string` - The ID of the exam to fetch.
*   **Returns:** `Observable<ApiResponse>` - An observable containing the API response with the exam details (`data.exam`).

---





*   **Purpose:** Creates a new exam.
*   **Endpoint:** `POST /api/v1/exams`
*   **Authentication:** Required (Admin Role).
*   **Parameters:**
    *   `examData`: `Partial<Exam>` - Object containing exam details (e.g., `{ title, description, questions: [...] }`).
*   **Returns:** `Observable<ApiResponse>` - An observable containing the API response with the newly created exam data (`data.exam`).



*   **Purpose:** Fetches all exams (for admin view).
*   **Endpoint:** `GET /api/v1/exams`
*   **Authentication:** Required (Admin Role).
*   **Returns:** `Observable<ApiResponse>` - An observable containing the API response with a list of all exams (`data.exams`).



*   **Purpose:** Fetches the details of a specific exam, including questions with correct answers (for admin view).
*   **Endpoint:** `GET /api/v1/exams/:id`
*   **Authentication:** Required (Admin Role).
*   **Parameters:**
    *   `examId`: `string` - The ID of the exam to fetch.
*   **Returns:** `Observable<ApiResponse>` - An observable containing the API response with detailed exam data (`data.exam`).



*   **Purpose:** Updates an existing exam's metadata (title, description, isActive).
*   **Endpoint:** `PATCH /api/v1/exams/:id`
*   **Authentication:** Required (Admin Role).
*   **Parameters:**
    *   `examId`: `string` - The ID of the exam to update.
    *   `examData`: `Partial<Exam>` - Object containing the fields to update.
*   **Returns:** `Observable<ApiResponse>` - An observable containing the API response with the updated exam data (`data.exam`).



*   **Purpose:** Deletes an exam.
*   **Endpoint:** `DELETE /api/v1/exams/:id`
*   **Authentication:** Required (Admin Role).
*   **Parameters:**
    *   `examId`: `string` - The ID of the exam to delete.
*   **Returns:** `Observable<ApiResponse>` - Expects a 204 No Content status on success.

---





*   **Purpose:** Adds a new question to a specific exam.
*   **Endpoint:** `POST /api/v1/exams/:examId/questions`
*   **Authentication:** Required (Admin Role).
*   **Parameters:**
    *   `examId`: `string` - The ID of the exam to add the question to.
    *   `questionData`: `Question` - Object containing question details (text, options, correctAnswer).
*   **Returns:** `Observable<ApiResponse>` - An observable containing the API response with the updated exam data (`data.exam`).



*   **Purpose:** Updates an existing question within a specific exam.
*   **Endpoint:** `PATCH /api/v1/exams/:examId/questions/:questionId`
*   **Authentication:** Required (Admin Role).
*   **Parameters:**
    *   `examId`: `string` - The ID of the exam containing the question.
    *   `questionId`: `string` - The ID of the question to update.
    *   `questionData`: `Partial<Question>` - Object containing the fields to update.
*   **Returns:** `Observable<ApiResponse>` - An observable containing the API response with the updated question data (`data.question`).



*   **Purpose:** Deletes a question from a specific exam.
*   **Endpoint:** `DELETE /api/v1/exams/:examId/questions/:questionId`
*   **Authentication:** Required (Admin Role).
*   **Parameters:**
    *   `examId`: `string` - The ID of the exam containing the question.
    *   `questionId`: `string` - The ID of the question to delete.
*   **Returns:** `Observable<ApiResponse>` - Expects a 204 No Content status on success.

---





*   **Purpose:** Submits a student's answers for a specific exam.
*   **Endpoint:** `POST /api/v1/results/submit`
*   **Authentication:** Required (Bearer Token).
*   **Parameters:**
    *   `submissionData`: `object` - Contains `examId` and an array of `answers` (`{ questionId, selectedOption }`).
*   **Returns:** `Observable<ApiResponse>` - An observable containing the API response with the result details (`data.result`).



*   **Purpose:** Fetches the result summaries for the currently logged-in student.
*   **Endpoint:** `GET /api/v1/results/my`
*   **Authentication:** Required (Bearer Token).
*   **Returns:** `Observable<ApiResponse>` - An observable containing the API response with a list of the student's result summaries (`data.results`).



*   **Purpose:** Fetches the detailed results for a specific exam submission by the logged-in student.
*   **Endpoint:** `GET /api/v1/results/my/:resultId`
*   **Authentication:** Required (Bearer Token).
*   **Parameters:**
    *   `resultId`: `string` - The ID of the result to fetch.
*   **Returns:** `Observable<ApiResponse>` - An observable containing the API response with detailed result data (`data.result`).

---





*   **Purpose:** Fetches all result summaries for a specific exam (for admin view).
*   **Endpoint:** `GET /api/v1/results/exam/:examId`
*   **Authentication:** Required (Admin Role).
*   **Parameters:**
    *   `examId`: `string` - The ID of the exam to fetch results for.
*   **Returns:** `Observable<ApiResponse>` - An observable containing the API response with a list of result summaries for that exam (`data.results`).



*   **Purpose:** Fetches the detailed results for any specific exam submission (for admin view).
*   **Endpoint:** `GET /api/v1/results/:resultId/details`
*   **Authentication:** Required (Admin Role).
*   **Parameters:**
    *   `resultId`: `string` - The ID of the result to fetch.
*   **Returns:** `Observable<ApiResponse>` - An observable containing the API response with detailed result data (`data.result`).


