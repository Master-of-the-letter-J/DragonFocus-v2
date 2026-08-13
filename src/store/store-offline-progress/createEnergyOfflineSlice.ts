import type { OfflineProgressSlice } from './offline-progress.types';

/** A fixed three-segment calculation keeps energy offline progression O(1). */
export const createEnergyOfflineSlice: OfflineProgressSlice<'getEnergyOfflineSegments'> = () => ({
	getEnergyOfflineSegments: progress => [
		{ activity: 'off-app', seconds: progress.offAppSeconds },
		{ activity: 'allowed-app', seconds: progress.allowedAppSeconds },
		{ activity: 'blocked-app', seconds: progress.blockedAppSeconds },
	],
});
