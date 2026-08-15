import type { StateCreator } from 'zustand';

export type NestedSlice<RootState extends object, Key extends keyof RootState> = StateCreator<RootState, [], [], Pick<RootState, Key>>;

export type NestedSliceSetter<SliceState extends object> = (update: Partial<SliceState> | SliceState | ((state: SliceState) => Partial<SliceState> | SliceState)) => void;

/** Adapts a root Zustand store's set/get functions to one nested feature slice. */
export const scopeNestedSlice = <RootState extends object, Key extends keyof RootState, SliceState extends RootState[Key] & object>(
	key: Key,
	set: Parameters<StateCreator<RootState>>[0],
	get: Parameters<StateCreator<RootState>>[1],
) => {
	const setSlice: NestedSliceSetter<SliceState> = update =>
		set(rootState => {
			const sliceState = rootState[key] as SliceState;
			const patch = typeof update === 'function' ? update(sliceState) : update;
			return { ...rootState, [key]: { ...sliceState, ...patch } };
		});

	return {
		setSlice,
		getSlice: () => get()[key] as SliceState,
		getRoot: get,
	};
};

/** Rehydrates nested slice data while retaining the live action functions created at startup. */
export const mergePersistedNestedState = <State extends object, Key extends keyof State>(persisted: unknown, current: State, nestedKeys: readonly Key[]): State => {
	const stored = (persisted ?? {}) as Partial<State>;
	const merged = { ...current, ...stored } as State;
	for (const key of nestedKeys) {
		const storedSlice = stored[key];
		if (storedSlice && typeof storedSlice === 'object' && !Array.isArray(storedSlice)) merged[key] = { ...current[key], ...storedSlice };
	}
	return merged;
};
