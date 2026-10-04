export class FaqEntryNotFoundError extends Error {
  constructor() {
    super('FAQ entry not found')
    this.name = 'FaqEntryNotFoundError'
  }
}
