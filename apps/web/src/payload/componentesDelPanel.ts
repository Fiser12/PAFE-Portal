import type { Config } from 'payload'

/** Compartido con el arnés de tests, como `localization`: si no, el test no ve el panel real */
export const componentesDelPanel: NonNullable<Config['admin']>['components'] = {
  beforeLogin: ['@/components/legacy/BeforeLogin'],
  beforeDashboard: ['@/components/legacy/BeforeDashboard'],
  actions: ['@/components/admin/VolverAlPortal'],
}
