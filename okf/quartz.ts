import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { componentRegistry } from "./quartz/components/registry"
import { profile, explorer } from "./okf.config.mjs"

// quartz-okf es un motor sin vocabulario: valida y dibuja lo que le diga el perfil del
// consumidor. Se inyecta antes de que Quartz instancie los plugins para que el sitio, el
// exportador y `okf-check` apliquen exactamente el mismo contrato — sin esto la wiki se
// valida contra el perfil de infraestructura que trae el toolkit por defecto.
componentRegistry.setOptionOverrides("quartz-okf", { profile })

// Los modos del explorador son datos, no código: viven en okf.config.mjs junto al perfil.
componentRegistry.setOptionOverrides("quartz-okf-explorer", explorer)

const config = await loadQuartzConfig()
export default config
export const layout = await loadQuartzLayout()
