export type InvitacionRuleCode = 'sin-permiso'

export class InvitacionRuleError extends Error {
  readonly code: InvitacionRuleCode

  constructor(code: InvitacionRuleCode, message?: string) {
    super(message ?? code)
    this.name = 'InvitacionRuleError'
    this.code = code
  }
}
