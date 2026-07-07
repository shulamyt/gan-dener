export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ParseError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class TenantNotFoundError extends AppError {
  constructor(phoneNumber: string) {
    super(`No tenant found for phone number: ${phoneNumber}`, 404);
  }
}

export class ChildNotFoundError extends AppError {
  public readonly suggestions: string[];

  constructor(name: string, suggestions: string[] = []) {
    super(`Child "${name}" not found`, 404);
    this.suggestions = suggestions;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422);
  }
}
