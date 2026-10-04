export class PackageNotFoundError extends Error {
  constructor() {
    super('Package not found or not currently available')
    this.name = 'PackageNotFoundError'
  }
}

export class InvalidDateRangeError extends Error {
  constructor() {
    super('endDate must be after startDate')
    this.name = 'InvalidDateRangeError'
  }
}

export class BookingNotFoundError extends Error {
  constructor() {
    super('Booking not found')
    this.name = 'BookingNotFoundError'
  }
}

export class BookingAccessDeniedError extends Error {
  constructor() {
    super('You do not have permission to access this booking')
    this.name = 'BookingAccessDeniedError'
  }
}

export class InvalidBookingStatusError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidBookingStatusError'
  }
}

export class GuideOrVehicleNotFoundError extends Error {
  constructor() {
    super('Guide or vehicle not found')
    this.name = 'GuideOrVehicleNotFoundError'
  }
}

export class GuideNotAvailableError extends Error {
  constructor() {
    super('This guide is already assigned to another active booking')
    this.name = 'GuideNotAvailableError'
  }
}

export class VehicleNotAvailableError extends Error {
  constructor() {
    super('This vehicle is already assigned to another active booking')
    this.name = 'VehicleNotAvailableError'
  }
}
