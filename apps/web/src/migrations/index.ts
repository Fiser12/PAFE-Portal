import * as migration_20250511_001726 from './20250511_001726';
import * as migration_20250617_125334 from './20250617_125334';
import * as migration_20250821_164028 from './20250821_164028';

export const migrations = [
  {
    up: migration_20250511_001726.up,
    down: migration_20250511_001726.down,
    name: '20250511_001726',
  },
  {
    up: migration_20250617_125334.up,
    down: migration_20250617_125334.down,
    name: '20250617_125334',
  },
  {
    up: migration_20250821_164028.up,
    down: migration_20250821_164028.down,
    name: '20250821_164028'
  },
];
