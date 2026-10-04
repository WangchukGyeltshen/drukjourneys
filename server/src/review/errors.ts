export class BookingNotReviewableError extends Error {
  constructor() {
    super('Only a completed (CONFIRMED) booking can be reviewed')
    this.name = 'BookingNotReviewableError'
  }
}

export class ReviewAlreadyExistsError extends Error {
  constructor() {
    super('This booking already has a review — use the update endpoint to change it')
    this.name = 'ReviewAlreadyExistsError'
  }
}

export class ReviewNotFoundError extends Error {
  constructor() {
    super('No review exists for this booking yet')
    this.name = 'ReviewNotFoundError'
  }
}
