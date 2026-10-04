export class SupportInquiryNotFoundError extends Error {
  constructor() {
    super('Support inquiry not found')
    this.name = 'SupportInquiryNotFoundError'
  }
}
