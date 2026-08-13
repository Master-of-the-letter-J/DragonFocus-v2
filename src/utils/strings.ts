/** capitalizes the first letter of a string */
function capitalize(str: string): string {
	if (str.length === 0) return str;
	return str.charAt(0).toUpperCase() + str.slice(1);
}
/** un-capitalizes the first letter of a string */
function unCapitalize(str: string): string {
	if (str.length === 0) return str;
	return str.charAt(0).toLowerCase() + str.slice(1);
}

/** its the end. now u have to flip the text  */
function flipText(text: string): string {
	return text.split('').reverse().join('');
}

/** adds spaces to a string for every capital letter */
function addSpaces(str: string): string {
	return str.replace(/([a-z])([A-Z])/g, '$1 $2');
}
enum DisplayUnits {
	K,
	M,
	B,
	T,
	q,
	Q,
	s,
	S,
	O,
	N,
	d,
	U,
	D,
	U14,
	/*
	td,
	qd,
	Qd,
	sd,
	Sd,
	Od,
	Nd,
	v,
	uv,
	dv,
	tv,
	qv,
	Qv,
	sv,
	Sv,
	Ov,
	Nv,
	TG,
	UG,
	U33,
	U34,
	U35,
	U36,
	U37,
	U38,
	U39,
	U40,
	*/
}

function addCommas(numStr: string): string {
	const [sign, rest] = numStr.startsWith('-') ? ['-', numStr.slice(1)] : ['', numStr];
	return sign + rest.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
/**
 * Formats a number using custom scaling rules:
 *
 * - Numbers less than 100,000 are formatted (with commas) as-is.
 * - When a number reaches 100,000 it becomes "X K" where the X value comes from dividing by 1e3.
 * - Each additional “unit” threshold grows by three zeros starting at 10^(5+3*i).
 * - Every formatted number has commas inserted every three digits.
 * - If fractionDigits is specified the number is truncated (not rounded) to that many digits.
 * - The unitDisplacement option shifts the effective unit one or more steps lower.
 *
 * @param value The number to format.
 * @param options Optional formatting options.
 */
export function formatNumber(value: number, fractionDigits = 2, unitDisplacement = 0): string {
	const displayUnits = Object.values(DisplayUnits) as (string | number)[];
	const units = displayUnits.filter(str => typeof str !== 'number') as string[];
	const absVal = Math.abs(value);
	let normalIndex = -1;
	for (let i = 0; i < units.length; i++) {
		if (absVal >= 10 ** (5 + 3 * i)) normalIndex = i;
		else break;
	}

	const effectiveIndex = normalIndex - unitDisplacement;
	if (effectiveIndex >= units.length - 1) return value.toExponential(fractionDigits + 2); // Scientific notation

	const suffix = effectiveIndex >= 0 ? units[effectiveIndex] : '';
	const factor = effectiveIndex >= 0 ? 10 ** (3 * (effectiveIndex + 1)) : 1;
	const scaled = value / factor;
	const formattedNumber = addCommas(scaled.toFixed(fractionDigits));
	return formattedNumber + suffix;
}

/**
 * Safely converts a string into a number.
 * Returns undefined if the input cannot be converted to a valid number.
 */
function convertToNumber(value: string): number | undefined {
	const trimmedValue = value.trim(); // Remove leading/trailing whitespace
	const parsedNumber = Number(trimmedValue);
	// Check if the parsed value is a valid number
	if (!Number.isNaN(parsedNumber) && trimmedValue !== '') {
		return parsedNumber;
	}
	// Return undefined for invalid inputs
	return undefined;
}

const gruntStrings = {
	capitalize,
	unCapitalize,
	flipText,
	addSpaces,
	addCommas,
	formatNumberToDisplay: formatNumber,
	convertToNumber,
};

export default gruntStrings;
