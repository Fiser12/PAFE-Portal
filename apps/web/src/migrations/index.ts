import * as migration_20250821_171109 from './20250821_171109';
import * as migration_20260706_175849 from './20260706_175849';

export const migrations = [
  {
    up: migration_20250821_171109.up,
    down: migration_20250821_171109.down,
    name: '20250821_171109',
  },
  {
    up: migration_20260706_175849.up,
    down: migration_20260706_175849.down,
    name: '20260706_175849'
  },
];
