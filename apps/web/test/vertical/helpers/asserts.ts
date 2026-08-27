import { expect } from 'vitest'

/** El servicio debe rechazar con LoanRuleError y el código indicado */
export const expectLoanError = (p: Promise<unknown>, code: string) =>
  expect(p).rejects.toMatchObject({ code })
