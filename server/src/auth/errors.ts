export class EmailAlreadyExistsError extends Error {
  constructor() {
    super('An account with this email already exists')
    this.name = 'EmailAlreadyExistsError'
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password')
    this.name = 'InvalidCredentialsError'
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid, expired, or revoked refresh token')
    this.name = 'InvalidRefreshTokenError'
  }
}
