/** coord with x and y */
export type Coord = { posX: number; posY: number };
/** left, right, top, bottom directions. */
export type Direction = 'top' | 'bottom' | 'left' | 'right';

const isCoordsEqual = (a: Coord, b: Coord) => a.posX === b.posX && a.posY === b.posY;

/** Rounds a value to __ digits after 0 */
const round = (a: number, value = 2): number => Math.round(a * 10 ** value) / 10 ** value;
const floor = (a: number, value = 2): number => Math.floor(a * 10 ** value) / 10 ** value;
const roundFixed = (a: number, value = 2): string => round(a, value).toFixed(value);
const floorFixed = (a: number, value = 2): string => floor(a, value).toFixed(value);

/** Returns true if the provided number is even. */
export const isEven = (n: number): boolean => n % 2 === 0;

/** Returns true if the provided number is odd. */
export const isOdd = (n: number): boolean => n % 2 !== 0;

/**
 * Returns a random even number between min and max (inclusive).
 * If there are no even numbers in the range, returns undefined.
 */
export function randomEvenBetween(min: number, max: number): number | undefined {
	if (min > max) {
		console.warn('min > max in randomEven gruntMath');
		[min, max] = [max, min];
	}

	const start = gruntMath.isEven(min) ? min : min + 1;
	const end = gruntMath.isEven(max) ? max : max - 1;

	// If no valid even exists in the range, return undefined.
	if (start > end) {
		return undefined;
	}

	// Calculate how many even numbers are in the range.
	// They form an arithmetic sequence: start, start+2, start+4, ..., end.
	const count = (end - start) / 2 + 1;
	// Pick a random index in that sequence.
	const randomIndex = Math.floor(Math.random() * count);
	return start + randomIndex * 2;
}

/**
 * Returns a random odd number between min and max (inclusive).
 * If there are no odd numbers in the range, returns undefined.
 */
export function randomOddBetween(min: number, max: number): number | undefined {
	if (min > max) {
		console.warn('min > max in randomOdd gruntMath');
		[min, max] = [max, min];
	}

	const start = gruntMath.isOdd(min) ? min : min + 1;
	const end = gruntMath.isOdd(max) ? max : max - 1;

	// If no valid odd exists in the range, return undefined.
	if (start > end) {
		return undefined;
	}

	// Calculate how many odd numbers exist. They run:
	// start, start+2, ...
	const count = (end - start) / 2 + 1;
	const randomIndex = Math.floor(Math.random() * count);
	return start + randomIndex * 2;
}

/** Clamps a number a between min and max */
const clamp = (a: number, min = -Infinity, max = Infinity) => Math.min(max, Math.max(min, a));

/** Clamps a number a between 0 and max */
const clamp0 = (a: number, max = Infinity) => clamp(a, 0, max);

/** Clamps a number a between 1 and max */
const clamp1 = (a: number, max = Infinity) => clamp(a, 1, max);

/** Linearly interpolates between x and y by a factor of a */
const lerp = (x: number, y: number, a: number) => x * (1 - a) + y * a;

/** Inverse linear interpolation of a between x and y, clamped between 0 and 1 */
const invlerp = (x: number, y: number, a: number) => clamp((a - x) / (y - x));

/** Maps a value a from range [x1, y1] to range [x2, y2] */
const range = (x1: number, y1: number, x2: number, y2: number, a: number) => lerp(x2, y2, invlerp(x1, y1, a));

/** Generates a random integer between min (inclusive) and max (inclusive) */
const randomIntInclusive = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Generates a random integer between min (inclusive) and max (exclusive) */
const randomIntExclusive = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

/** Generates a random float between min (inclusive) and max (exclusive) */
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

/** Rolls a chance, number gotta be less then 1! */
const rollChance = (chance: number) => Math.random() < chance;

/** Retrieves a random value from an array */
function rollArray<T>(array: T[]): T | undefined {
	const randomIndex = Math.floor(Math.random() * array.length);
	return array[randomIndex];
}
/** Retrieves a random value from an array given a range */
function rollArrayRange<T>(array: T[], minIndex = 0, maxIndex: number = array.length - 1): T | undefined {
	if (array.length === 0 || array.length === 1) return rollArray(array);
	if (minIndex > maxIndex) [maxIndex, minIndex] = [minIndex, maxIndex];

	// Clamp the indices within valid bounds
	const clampedMinIndex = clamp(minIndex, 0, array.length - 1);
	const clampedMaxIndex = clamp(maxIndex, 0, array.length - 1);

	const randomIndex = randomIntInclusive(clampedMinIndex, clampedMaxIndex);
	return array[randomIndex];
}

function rollArrayPercent<T>(array: T[], minPercent = 0, maxPercent = 1): T | undefined {
	if (array.length === 0 || array.length === 1) return rollArray(array);
	if (minPercent > maxPercent) {
		console.error(`min > max when rolling range of array of length: ${array.length}`);
		[maxPercent, minPercent] = [minPercent, maxPercent];
	}
	if (minPercent < 0 || maxPercent > 1) console.warn(`percent out of bounds when rolling array percent of array of length: ${array.length}`);

	// Convert percentages to index ranges
	const minIndex = clamp(Math.floor(array.length * minPercent), 0, array.length - 1);
	const maxIndex = clamp(Math.floor(array.length * maxPercent), 0, array.length - 1);

	return rollArrayRange(array, minIndex, maxIndex);
}
/** Clears all elements from an array, returning this cleared copy */
function clearArray<T>(array: T[]): T[] {
	const newArray: T[] = array.concat();
	while (newArray.length > 0) {
		newArray.pop();
	}
	return newArray;
}

/**
 * Remove Duplicates from an Array, returning a new array with the first of the distinct function
 * @param array The original array
 * @param isEqual Function used to compare each value, if equal only first one will be in new array!
 */
function distinctifyArray<T>(array: T[], isEqual?: (thisVal: T, otherVal: T) => boolean): T[] {
	const newArray: T[] = array.concat();
	return newArray.filter((val, index, self) => index === self.findIndex(otherVal => (isEqual !== undefined ? isEqual(val, otherVal) : val === otherVal)));
}

function distinctifyArrayPredefined<T extends { isEqual(other: T): boolean }>(array: T[]): T[] {
	const newArray: T[] = array.concat();
	return newArray.filter((val, index, self) => index === self.findIndex(otherVal => val.isEqual(otherVal)));
}

/** Fisher-Yates shuffle algorithm to shuffle an array */
function shuffleArray<T>(array: T[]): T[] {
	const newArray: T[] = array.concat();

	for (let i = newArray.length - 1; i >= 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
	}
	return newArray;
}

/** Adds a value to an index of an array. If at end, will continuously push values, so try not to do this. */
function addToIndex<T>(prev: T[], value: T, index: number): T[] {
	const prevArray = prev.concat();
	const newArray = [
		...prevArray.slice(0, index), // Add elements before the index
		value, // Add the new import at the specified index
		...prevArray.slice(index), // Add elements after the index
	];
	while (newArray.length - 1 < index) {
		console.warn('adding to array in addToIndex');
		newArray.push(value);
	}
	return newArray;
}

/** Replaces a value from a certain index */
function replaceIndex<T>(prev: T[], value: T, index: number): T[] {
	const prevArray = prev.concat();
	const newArray = [
		...prevArray.slice(0, index), // Add elements before the index
		value, // Add the new import at the specified index
		...prevArray.slice(index + 1), // Add elements after the index, with the value replacing the missing one
	];
	while (newArray.length - 1 < index) {
		console.warn('adding to array');
		newArray.push(value);
	}
	return newArray;
}

/** turns a T[] | T to a [...T] or [T] */
function toArray<T>(prev: T | T[]): T[] {
	return Array.isArray(prev) ? prev : [prev];
}

/** loops a function until defined or reach max iteration. */
function loopUntilDefined<T>(func: () => T | undefined, maxIterations: number, message?: string, messageType: 'log' | 'warn' | 'error' = 'warn'): T | undefined {
	if (maxIterations < 0) throw new Error('grunt ~ max iterations < 0! change to be above');

	for (let i = 0; i < maxIterations; i++) {
		const value = func();
		if (value !== undefined) {
			return value;
		}
	}
	if (message) console[messageType](message);

	return undefined;
}

/**
 * Runs an async function, and if it takes longer than maxTime milliseconds,
 * automatically retries it.
 *
 * @param fn - The asynchronous function you want to run.
 * @param maxTime - Maximum number of milliseconds to allow before retrying.
 * @param retries - (optional) Maximum number of retries. If omitted, will retry indefinitely.
 * @returns A promise that resolves with the value returned by fn.
 */
async function redoWithTimeout<T>(fn: () => Promise<T>, maxTime: number, retries = Infinity): Promise<T> {
	try {
		return await runWithTimeout(fn, maxTime);
	} catch (err) {
		if (retries <= 0) {
			throw new Error(`Maximum retry limit reached. Last error: ${err ? String(err) : '(no error message!)'}`);
		}
		console.warn(`Function took too long (>${maxTime}ms), retrying... (${retries} retries remaining)`);
		return redoWithTimeout(fn, maxTime, retries - 1);
	}
}

/**
 * Helper that races an asynchronous function against a timeout.
 *
 * @param fn - The asynchronous function.
 * @param timeoutMs - Milliseconds to wait before timeout.
 * @returns A promise that either resolves with fn()’s result or rejects on timeout.
 */
async function runWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error('Function took too long'));
		}, timeoutMs);

		fn()
			.then(result => {
				clearTimeout(timeout);
				resolve(result);
			})
			.catch(err => {
				clearTimeout(timeout);
				reject(err);
			});
	});
}

/** Delays time in an async function, in milliseconds
 * @example await delay(2000);
 */
function delay(ms: number, abortSignal?: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			resolve();
		}, ms);

		// Listen for the abort signal.
		if (abortSignal) {
			abortSignal.addEventListener('abort', () => {
				clearTimeout(timeout);
				reject(new Error('Canceled'));
			});
		}
	});
}

const gruntMath = {
	isEven,
	isOdd,
	round,
	floor,
	roundFixed,
	floorFixed,
	lerp,
	invlerp,
	clamp,
	clamp0,
	clamp1,
	range,
	randomFloat,
	randomIntExclusive,
	randomIntInclusive,
	randomEvenBetween,
	randomOddBetween,
	rollChance,
	clearArray,
	distinctifyArray,
	distinctifyArrayPredefined,
	shuffleArray,
	rollArray,
	rollArrayRange,
	rollArrayPercent,
	addToIndex,
	replaceIndex,
	toArray,
	delay,
	redoWithTimeout,
	runWithTimeout,
	loopUntilDefined,
	isCoordsEqual,
};

export default gruntMath;
