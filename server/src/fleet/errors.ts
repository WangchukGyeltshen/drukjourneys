export class GuideNotFoundError extends Error {
  constructor() {
    super('Guide not found')
    this.name = 'GuideNotFoundError'
  }
}

export class VehicleNotFoundError extends Error {
  constructor() {
    super('Vehicle not found')
    this.name = 'VehicleNotFoundError'
  }
}

export class DuplicateLicenseNumberError extends Error {
  constructor() {
    super('A guide with this license number already exists')
    this.name = 'DuplicateLicenseNumberError'
  }
}

export class DuplicatePlateNumberError extends Error {
  constructor() {
    super('A vehicle with this plate number already exists')
    this.name = 'DuplicatePlateNumberError'
  }
}
