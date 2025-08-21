import * as migration_20250821_171109 from './20250821_171109';

export const migrations = [
  {
    up: migration_20250821_171109.up,
    down: migration_20250821_171109.down,
    name: '20250821_171109'
  },
];
