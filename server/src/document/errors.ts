export class InvalidFileTypeError extends Error {
  constructor() {
    super('File type not allowed. Accepted types: PDF, JPG, PNG')
    this.name = 'InvalidFileTypeError'
  }
}

export class FileTooLargeError extends Error {
  constructor() {
    super('File exceeds the maximum allowed size (10 MB)')
    this.name = 'FileTooLargeError'
  }
}

export class DocumentNotFoundError extends Error {
  constructor() {
    super('Document not found')
    this.name = 'DocumentNotFoundError'
  }
}

export class DocumentAccessDeniedError extends Error {
  constructor() {
    super('You do not have permission to access this document')
    this.name = 'DocumentAccessDeniedError'
  }
}
