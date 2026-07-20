import * as migration_20260712_175129 from './20260712_175129';
import * as migration_20260720_123440 from './20260720_123440';
import * as migration_20260720_131220 from './20260720_131220';
import * as migration_20260720_132740 from './20260720_132740';

export const migrations = [
  {
    up: migration_20260712_175129.up,
    down: migration_20260712_175129.down,
    name: '20260712_175129',
  },
  {
    up: migration_20260720_123440.up,
    down: migration_20260720_123440.down,
    name: '20260720_123440',
  },
  {
    up: migration_20260720_131220.up,
    down: migration_20260720_131220.down,
    name: '20260720_131220',
  },
  {
    up: migration_20260720_132740.up,
    down: migration_20260720_132740.down,
    name: '20260720_132740',
  },
];
