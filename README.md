# Exam System Backend

This is the Node.js backend for the Exam System application, built with Express and Mongoose.

## Project Structure

```
exam-backend/
├── handlers/         # Request handling logic (controllers)
│   ├── authHandler.js
│   ├── examHandler.js
│   └── resultHandler.js
├── middlewares/      # Custom middleware (e.g., authentication)
│   └── authMiddleware.js
├── models/           # Mongoose data models
│   ├── Exam.js
│   ├── Result.js
│   └── User.js
├── routes/           # API route definitions
│   ├── authRoutes.js
│   ├── examRoutes.js
│   └── resultRoutes.js
├── app.js            # Express application setup (middleware, routes)
├── index.js          # Server entry point (DB connection, start server)
├── config.env.example # Example environment variables file
├── package.json
├── package-lock.json
└── README.md         # This file
```

## Features

*   **User Authentication:** Student registration and login, Admin login.
*   **Role-Based Access Control:** Differentiates between Student and Admin permissions.
*   **Exam Management (Admin):** Create, Read, Update, Delete exams.
*   **Question Management (Admin):** Add, Update, Delete questions within exams.
*   **Exam Taking (Student):** View available exams, take an exam (fetch questions without answers).
*   **Result Submission & Viewing:** Submit answers, calculate score, view own results (Student), view all results for an exam (Admin).

## Prerequisites

*   Node.js (v14 or later recommended)
*   npm (usually comes with Node.js)
*   MongoDB (e.g., a local instance or a cloud service like MongoDB Atlas)

## Setup and Installation

1.  **Clone/Download:** Get the project files.
2.  **Navigate to Directory:** Open a terminal and `cd` into the `exam-backend` directory.
3.  **Install Dependencies:** Run `npm install`.
4.  **Configure Environment Variables:**
    *   Rename `config.env.example` to `config.env`.
    *   Open `config.env` and fill in the required values:
        *   `PORT`: The port the server will run on (default is 3000).
        *   `NODE_ENV`: Set to `development` or `production`.
        *   `DATABASE_URL`: Your MongoDB connection string (replace `<USERNAME>`, `<PASSWORD>`, and potentially the database name).
        *   `DATABASE_PASSWORD`: Your MongoDB user's password.
        *   `JWT_SECRET`: A strong, secret string for signing JWT tokens.
        *   `JWT_EXPIRES_IN`: How long tokens should be valid (e.g., `90d`, `1h`).
5.  **Start the Server:**
    *   For development (with automatic restarts on file changes, requires `nodemon`): `npm install -g nodemon` (if not installed) then `nodemon index.js`
    *   For production/standard start: `node index.js`

The server should now be running on the specified port (e.g., `http://localhost:3000`).

## API Endpoints

Base URL: `/api/v1`

**Authentication (`/auth`)**

*   `POST /register`: Register a new student account.
*   `POST /login`: Log in (Student or Admin).

**Exams (`/exams`)**

*   `GET /available`: (Student) Get a list of active exams.
*   `GET /:id/take`: (Student) Get details of a specific exam to take (questions without answers).
*   `POST /`: (Admin) Create a new exam.
*   `GET /`: (Admin) Get all exams.
*   `GET /:id`: (Admin) Get details of a specific exam.
*   `PATCH /:id`: (Admin) Update exam details (title, description, isActive).
*   `DELETE /:id`: (Admin) Delete an exam.
*   `POST /:id/questions`: (Admin) Add a question to an exam.
*   `PATCH /:examId/questions/:questionId`: (Admin) Update a question.
*   `DELETE /:examId/questions/:questionId`: (Admin) Delete a question.

**Results (`/results`)**

*   `POST /submit`: (Student) Submit answers for an exam.
*   `GET /my`: (Student) Get the logged-in student's result summaries.
*   `GET /my/:resultId`: (Student) Get details of a specific result for the logged-in student.
*   `GET /exam/:examId`: (Admin) Get all results for a specific exam.
*   `GET /:resultId/details`: (Admin) Get details of any specific result.

**Note:** Most Exam and Result routes require authentication (Bearer Token in Authorization header). Admin routes require the user to have the 'admin' role.
