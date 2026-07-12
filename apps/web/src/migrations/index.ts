import * as migration_20260706_205229 from './20260706_205229';
import * as migration_20260712_142127_roles from './20260712_142127_roles';
import * as migration_20260712_142153_groups from './20260712_142153_groups';

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
    name: '20260712_142153_groups'
  },
];
