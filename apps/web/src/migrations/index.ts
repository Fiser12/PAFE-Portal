import * as migration_20260706_205229 from './20260706_205229';
import * as migration_20260712_142127_roles from './20260712_142127_roles';
import * as migration_20260712_142153_groups from './20260712_142153_groups';
import * as migration_20260712_154645_catalog_reorg from './20260712_154645_catalog_reorg';
import * as migration_20260712_154702_search_sin_posts from './20260712_154702_search_sin_posts';
import * as migration_20260712_155925_ficheros from './20260712_155925_ficheros';
import * as migration_20260712_160032_adios_pdf from './20260712_160032_adios_pdf';
import * as migration_20260712_160951_catalogo_digital from './20260712_160951_catalogo_digital';
import * as migration_20260712_161032_adios_digital_item from './20260712_161032_adios_digital_item';

export const migrations = [
  {
    up: migration_20260706_205229.up,
    down: migration_20260706_205229.down,
    name: '20260706_205229',
  },
  {
    up: migration_20260712_142127_roles.up,
    down: migration_20260712_142127_roles.down,
    name: '20260712_142127_roles',
  },
  {
    up: migration_20260712_142153_groups.up,
    down: migration_20260712_142153_groups.down,
    name: '20260712_142153_groups',
  },
  {
    up: migration_20260712_154645_catalog_reorg.up,
    down: migration_20260712_154645_catalog_reorg.down,
    name: '20260712_154645_catalog_reorg',
  },
  {
    up: migration_20260712_154702_search_sin_posts.up,
    down: migration_20260712_154702_search_sin_posts.down,
    name: '20260712_154702_search_sin_posts',
  },
  {
    up: migration_20260712_155925_ficheros.up,
    down: migration_20260712_155925_ficheros.down,
    name: '20260712_155925_ficheros',
  },
  {
    up: migration_20260712_160032_adios_pdf.up,
    down: migration_20260712_160032_adios_pdf.down,
    name: '20260712_160032_adios_pdf',
  },
  {
    up: migration_20260712_160951_catalogo_digital.up,
    down: migration_20260712_160951_catalogo_digital.down,
    name: '20260712_160951_catalogo_digital',
  },
  {
    up: migration_20260712_161032_adios_digital_item.up,
    down: migration_20260712_161032_adios_digital_item.down,
    name: '20260712_161032_adios_digital_item'
  },
];
