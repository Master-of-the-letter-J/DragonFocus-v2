import type { OfflineProgressSlice } from './offline-progress.types';

/** Humans, Zombies, and Cyborgs use the same fixed activity segments and closed-form world formulas. */
export const createPopulationOfflineSlice: OfflineProgressSlice<'getPopulationOfflineSegments'> = () => ({
	getPopulationOfflineSegments: progress => [
		{ activity: 'off-app', seconds: progress.offAppSeconds },
		{ activity: 'allowed-app', seconds: progress.allowedAppSeconds },
		{ activity: 'blocked-app', seconds: progress.blockedAppSeconds },
	],
});
