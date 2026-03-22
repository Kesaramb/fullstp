import * as migration_20260316_083018_initial from './20260316_083018_initial';

export const migrations = [
  {
    up: migration_20260316_083018_initial.up,
    down: migration_20260316_083018_initial.down,
    name: '20260316_083018_initial',
  },
];
