export type LoanRuleCode =
  | 'sin-permiso'
  | 'cupo-lleno'
  | 'justificacion-requerida'
  | 'sin-stock'
  | 'reserva-duplicada'
  | 'transicion-invalida'
  | 'prorroga-ya-usada'
  | 'prorroga-fuera-de-plazo'
  | 'prorroga-penalizado'

export class LoanRuleError extends Error {
  readonly code: LoanRuleCode

  constructor(code: LoanRuleCode, message?: string) {
    super(message ?? code)
    this.name = 'LoanRuleError'
    this.code = code
  }
}

export type RuleCheck = { ok: true } | { ok: false; code: LoanRuleCode }
