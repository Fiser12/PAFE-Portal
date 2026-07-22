import * as migration_20260712_175129 from './20260712_175129';
import * as migration_20260720_123440 from './20260720_123440';
import * as migration_20260720_131220 from './20260720_131220';
import * as migration_20260720_132740 from './20260720_132740';
import * as migration_20260721_221832 from './20260721_221832';
import * as migration_20260722_012839_lexical_questionnaire_pages from './20260722_012839_lexical_questionnaire_pages';

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
  {
    up: migration_20260721_221832.up,
    down: migration_20260721_221832.down,
    name: '20260721_221832',
  },
  {
    up: migration_20260722_012839_lexical_questionnaire_pages.up,
    down: migration_20260722_012839_lexical_questionnaire_pages.down,
    name: '20260722_012839_lexical_questionnaire_pages'
  },
];
