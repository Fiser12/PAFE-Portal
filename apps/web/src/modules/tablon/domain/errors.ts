export type TablonRuleCode =
  | 'sin-permiso'
  | 'area-requerida'
  | 'noticia-no-encontrada'
  | 'mensaje-vacio'

export class TablonRuleError extends Error {
  readonly code: TablonRuleCode

  constructor(code: TablonRuleCode, message?: string) {
    super(message ?? code)
    this.name = 'TablonRuleError'
    this.code = code
  }
}
