const AppError = require('./errors');

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class TokenExpiredError extends AppError {
  constructor(message = 'Token has expired') {
    super(message, 401, 'TOKEN_EXPIRED');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class ResourceNotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'RESOURCE_NOT_FOUND');
  }
}

class DuplicateResourceError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} already exists`, 409, 'DUPLICATE_RESOURCE');
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}
    
class ExamNotFoundError extends ResourceNotFoundError {
  constructor() {
    super('Exam');
  }
}

class ExamSubmissionError extends AppError {
  constructor(message = 'Failed to submit exam') {
    super(message, 400, 'EXAM_SUBMISSION_ERROR');
  }
}

class ExamAlreadySubmittedError extends AppError {
  constructor() {
    super('Exam has already been submitted', 409, 'EXAM_ALREADY_SUBMITTED');
  }
}

module.exports = {
  AuthenticationError,
  TokenExpiredError,
  AuthorizationError,
  ResourceNotFoundError,
  DuplicateResourceError,
  ValidationError,
  ExamNotFoundError,
  ExamSubmissionError,
  ExamAlreadySubmittedError
}; 