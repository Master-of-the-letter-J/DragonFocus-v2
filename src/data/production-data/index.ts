import { AMPLIFIERS } from './amplifiers';
import { DEITIES } from './deities';
import { FORGES } from './forges';
import { ARMAGEDDON_MONUMENTS } from './monuments-armageddon';
import { TRANSCENSION_MONUMENTS } from './monuments-trascension';
import { PRODUCER_UPGRADES } from './producer-upgrades';
import { PRODUCERS } from './producers';
import { RESPEC_POWERS } from './respec';
import { APOCALYPSE_BOOST_UPGRADES, CLICKERS, ENERGY_UPGRADES, GOAL_MULTIPLIERS, POMODORO_BOOST_UPGRADES, SPECIAL_GENERATORS } from './special-production';
import { TITANS } from './titans';

export * from './amplifiers';
export * from './deities';
export * from './forges';
export * from './monuments-armageddon';
export * from './monuments-trascension';
export * from './producer-upgrades';
export * from './producers';
export * from './respec';
export * from './special-production';
export * from './titans';

export const PRODUCTION_ITEMS = [...PRODUCERS, ...AMPLIFIERS, ...CLICKERS, ...SPECIAL_GENERATORS, ...ENERGY_UPGRADES, ...PRODUCER_UPGRADES, ...GOAL_MULTIPLIERS, ...POMODORO_BOOST_UPGRADES, ...APOCALYPSE_BOOST_UPGRADES, ...ARMAGEDDON_MONUMENTS, ...TRANSCENSION_MONUMENTS, ...FORGES, ...DEITIES, ...TITANS, ...RESPEC_POWERS];

export const PRODUCTION_BY_ID = Object.fromEntries(PRODUCTION_ITEMS.map(item => [item.id, item]));
