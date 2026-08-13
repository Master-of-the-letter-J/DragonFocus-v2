import { initialPrestigeState, type PrestigeSlice } from './prestige.types';

export const createPrestigeCoreSlice: PrestigeSlice<'reset'> = set => ({ reset: () => set(initialPrestigeState()) });
