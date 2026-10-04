export class InvalidBookingStatusForPaymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidBookingStatusForPaymentError'
  }
}

export class UnsupportedCurrencyForStripeError extends Error {
  constructor() {
    super(
      'This booking cannot be paid via Stripe — its SDF was not calculated in USD. ' +
        'Regional/domestic bookings use the bank transfer process instead.'
    )
    this.name = 'UnsupportedCurrencyForStripeError'
  }
}

export class PaymentAlreadyExistsError extends Error {
  constructor() {
    super('A payment already exists for this booking')
    this.name = 'PaymentAlreadyExistsError'
  }
}
