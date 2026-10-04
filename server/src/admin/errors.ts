export class UserNotFoundError extends Error {
  constructor() {
    super('User not found')
    this.name = 'UserNotFoundError'
  }
}

export class CannotModifyOwnRoleError extends Error {
  constructor() {
    super(
      'You cannot change your own role through this endpoint — ask another admin, ' +
        'or use Prisma Studio directly, to avoid accidentally locking yourself out'
    )
    this.name = 'CannotModifyOwnRoleError'
  }
}
