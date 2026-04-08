import * as migration_20260324_081745 from './20260324_081745';
import * as migration_20260408_233500 from './20260408_233500';
import * as migration_20260408_235900 from './20260408_235900';

export const migrations = [
  {
    up: migration_20260324_081745.up,
    down: migration_20260324_081745.down,
    name: '20260324_081745'
  },
  {
    up: migration_20260408_233500.up,
    down: migration_20260408_233500.down,
    name: '20260408_233500'
  },
  {
    up: migration_20260408_235900.up,
    down: migration_20260408_235900.down,
    name: '20260408_235900'
  },
];
