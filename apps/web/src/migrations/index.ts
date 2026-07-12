import * as migration_20260706_205229 from './20260706_205229';
import * as migration_20260712_142127_roles from './20260712_142127_roles';
import * as migration_20260712_142153_groups from './20260712_142153_groups';
import * as migration_20260712_154645_catalog_reorg from './20260712_154645_catalog_reorg';
import * as migration_20260712_154702_search_sin_posts from './20260712_154702_search_sin_posts';

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
    name: '20260712_154702_search_sin_posts'
  },
];
