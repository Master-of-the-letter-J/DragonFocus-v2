import gruntMath from '../utils/math';
import gruntStrings from '../utils/strings';

export type CustomColor = {
	name: string;
	color: string;
};

const allColorValues = {
	aliceblue: '#f0f8ff',
	antiquewhite: '#faebd7',
	aqua: '#00ffff',
	aquamarine: '#7fffd4',
	azure: '#f0ffff',
	beige: '#f5f5dc',
	bisque: '#ffe4c4',
	black: '#000000',
	blanchedalmond: '#ffebcd',
	blue: '#0000ff',
	blueviolet: '#8a2be2',
	brown: '#a52a2a',
	burlywood: '#deb887',
	cadetblue: '#5f9ea0',
	chartreuse: '#7fff00',
	chocolate: '#d2691e',
	coral: '#ff7f50',
	cornflowerblue: '#6495ed',
	cornsilk: '#fff8dc',
	crimson: '#dc143c',
	cyan: '#00ffff',
	darkblue: '#00008b',
	darkcyan: '#008b8b',
	darkgoldenrod: '#b8860b',
	darkgray: '#a9a9a9',
	darkgreen: '#006400',
	darkgrey: '#a9a9a9',
	darkkhaki: '#bdb76b',
	darkmagenta: '#8b008b',
	darkolivegreen: '#556b2f',
	darkorange: '#ff8c00',
	darkorchid: '#9932cc',
	darkred: '#8b0000',
	darksalmon: '#e9967a',
	darkseagreen: '#8fbc8f',
	darkslateblue: '#483d8b',
	darkslategray: '#2f4f4f',
	darkslategrey: '#2f4f4f',
	darkturquoise: '#00ced1',
	darkviolet: '#9400d3',
	deeppink: '#ff1493',
	deepskyblue: '#00bfff',
	dimgray: '#696969',
	dimgrey: '#696969',
	dodgerblue: '#1e90ff',
	firebrick: '#b22222',
	floralwhite: '#fffaf0',
	forestgreen: '#228b22',
	fuchsia: '#ff00ff',
	gainsboro: '#dcdcdc',
	ghostwhite: '#f8f8ff',
	gold: '#ffd700',
	goldenrod: '#daa520',
	gray: '#808080',
	green: '#008000',
	greenyellow: '#adff2f',
	grey: '#808080',
	honeydew: '#f0fff0',
	hotpink: '#ff69b4',
	indianred: '#cd5c5c',
	indigo: '#4b0082',
	ivory: '#fffff0',
	khaki: '#f0e68c',
	lavender: '#e6e6fa',
	lavenderblush: '#fff0f5',
	lawngreen: '#7cfc00',
	lemonchiffon: '#fffacd',
	lightblue: '#add8e6',
	lightcoral: '#f08080',
	lightcyan: '#e0ffff',
	lightgoldenrodyellow: '#fafad2',
	lightgray: '#d3d3d3',
	lightgreen: '#90ee90',
	lightgrey: '#d3d3d3',
	lightpink: '#ffb6c1',
	lightsalmon: '#ffa07a',
	lightseagreen: '#20b2aa',
	lightskyblue: '#87cefa',
	lightslategray: '#778899',
	lightslategrey: '#778899',
	lightsteelblue: '#b0c4de',
	lightyellow: '#ffffe0',
	lime: '#00ff00',
	limegreen: '#32cd32',
	linen: '#faf0e6',
	magenta: '#ff00ff',
	maroon: '#800000',
	mediumaquamarine: '#66cdaa',
	mediumblue: '#0000cd',
	mediumorchid: '#ba55d3',
	mediumpurple: '#9370db',
	mediumseagreen: '#3cb371',
	mediumslateblue: '#7b68ee',
	mediumspringgreen: '#00fa9a',
	mediumturquoise: '#48d1cc',
	mediumvioletred: '#c71585',
	midnightblue: '#191970',
	mintcream: '#f5fffa',
	mistyrose: '#ffe4e1',
	moccasin: '#ffe4b5',
	navajowhite: '#ffdead',
	navy: '#000080',
	oldlace: '#fdf5e6',
	olive: '#808000',
	olivedrab: '#6b8e23',
	orange: '#ffa500',
	orangered: '#ff4500',
	orchid: '#da70d6',
	palegoldenrod: '#eee8aa',
	palegreen: '#98fb98',
	paleturquoise: '#afeeee',
	palevioletred: '#db7093',
	papayawhip: '#ffefd5',
	peachpuff: '#ffdab9',
	peru: '#cd853f',
	pink: '#ffc0cb',
	plum: '#dda0dd',
	powderblue: '#b0e0e6',
	purple: '#800080',
	red: '#ff0000',
	rosybrown: '#bc8f8f',
	royalblue: '#4169e1',
	saddlebrown: '#8b4513',
	salmon: '#fa8072',
	sandybrown: '#f4a460',
	seagreen: '#2e8b57',
	seashell: '#fff5ee',
	sienna: '#a0522d',
	silver: '#c0c0c0',
	skyblue: '#87ceeb',
	slateblue: '#6a5acd',
	slategray: '#708090',
	slategrey: '#708090',
	snow: '#fffafa',
	springgreen: '#00ff7f',
	steelblue: '#4682b4',
	tan: '#d2b48c',
	teal: '#008080',
	thistle: '#d8bfd8',
	tomato: '#ff6347',
	turquoise: '#40e0d0',
	violet: '#ee82ee',
	wheat: '#f5deb3',
	white: '#ffffff',
	whitesmoke: '#f5f5f5',
	yellow: '#ffff00',
	yellowgreen: '#9acd32',
};
const colorValues = {
	black: '#000000',
	blue: '#0000ff',
	brown: '#a52a2a',
	cornflowerblue: '#6495ed',
	cyan: '#00ffff',
	darkblue: '#00008b',
	darkcyan: '#008b8b',
	darkgray: '#a9a9a9',
	darkgreen: '#006400',
	darkgrey: '#a9a9a9',
	darkmagenta: '#8b008b',
	darkolivegreen: '#556b2f',
	darkorange: '#ff8c00',
	darkred: '#8b0000',
	darkturquoise: '#00ced1',
	darkviolet: '#9400d3',
	deeppink: '#ff1493',
	deepskyblue: '#00bfff',
	floralwhite: '#fffaf0',
	forestgreen: '#228b22',
	gold: '#ffd700',
	gray: '#808080',
	green: '#008000',
	grey: '#808080',
	hotpink: '#ff69b4',
	indigo: '#4b0082',
	lavender: '#e6e6fa',
	lavenderblush: '#fff0f5',
	lightblue: '#add8e6',
	lightcoral: '#f08080',
	lightcyan: '#e0ffff',
	lightgray: '#d3d3d3',
	lightgreen: '#90ee90',
	lightpink: '#ffb6c1',
	lightyellow: '#ffffe0',
	lime: '#00ff00',
	magenta: '#ff00ff',
	maroon: '#800000',
	midnightblue: '#191970',
	navy: '#000080',
	olive: '#808000',
	orange: '#ffa500',
	orangered: '#ff4500',
	palegreen: '#98fb98',
	paleturquoise: '#afeeee',
	palevioletred: '#db7093',
	pink: '#ffc0cb',
	plum: '#dda0dd',
	purple: '#800080',
	red: '#ff0000',
	saddlebrown: '#8b4513',
	silver: '#c0c0c0',
	skyblue: '#87ceeb',
	steelblue: '#4682b4',
	tan: '#d2b48c',
	teal: '#008080',
	tomato: '#ff6347',
	turquoise: '#40e0d0',
	violet: '#ee82ee',
	white: '#ffffff',
	yellow: '#ffff00',
	yellowgreen: '#9acd32',
};

/**
 * Converts a hex color to an rgba string.
 *
 * @param hexColor - A hex color string (with or without a '#' prefix).
 * @param alpha - A fraction between 0 and 1 for the alpha channel.
 * @returns The rgba color string.
 */
function hexToRgba(hexColor: string, alpha?: number): string {
	let hex = hexColor.replace('#', '');

	// Expand shorthand form (e.g., "#abb" -> "#aabbcc")
	if (hex.length === 3) {
		hex = hex
			.split('')
			.map(c => c + c)
			.join('');
	}
	if (hex.length === 6) hex = hex.concat('ff');
	while (hex.length < 8) {
		hex += 'f';
	}
	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);
	const a = alpha ?? parseInt(hex.slice(6, 8), 16) / 255;

	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hexToRgbaArray(hexColor: string, alpha?: number): number[] {
	const rgbaColor = hexToRgba(hexColor, alpha);
	const parts = rgbaColor
		.replace(/rgba?\(|\)/g, '')
		.split(',')
		.map(part => part.trim());
	parts.length = 4;
	const numberedParts = parts.map(val => Number(val));
	return numberedParts;
}

/**
 * Converts an rgba color string to an 8-digit hex color
 */
function rgbaToHex(rgbaColor: string): string {
	// Remove "rgba(" and ")" and split the string by commas.
	const parts = rgbaColor
		.replace(/rgba?\(|\)/g, '')
		.split(',')
		.map(part => part.trim());
	const [rStr, gStr, bStr, aStr] = parts;
	const r = parseInt(rStr, 10);
	const g = parseInt(gStr, 10);
	const b = parseInt(bStr, 10);
	const a = Math.round(parseFloat(aStr) * 255);

	const toHex = (n: number): string => n.toString(16).padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(a)}`;
}

/** get a random color */
const getRandomColor = (simple = false) => {
	const randomColorName: keyof typeof allColorValues = (gruntMath.rollArray(Object.keys(simple ? colorValues : allColorValues)) as keyof typeof allColorValues) ?? ('black' as keyof typeof allColorValues);
	const randomColorHex = allColorValues[randomColorName];
	const randomColorRgba = hexToRgba(randomColorHex, 1);
	return {
		name: randomColorName,
		colorHex: randomColorHex,
		colorRgba: randomColorRgba,
	};
};
/** Finds the closest named color by RGB distance. */
const closestColor = (inputColorHex: string) => {
	const [inputR, inputG, inputB] = hexToRgbaArray(inputColorHex, 1);
	let closestName: keyof typeof colorValues | undefined;
	let closestDistance = Number.POSITIVE_INFINITY;

	for (const [name, colorHex] of Object.entries(colorValues) as [keyof typeof colorValues, string][]) {
		const [r, g, b] = hexToRgbaArray(colorHex, 1);
		const distance = Math.pow(inputR - r, 2) + Math.pow(inputG - g, 2) + Math.pow(inputB - b, 2);
		if (distance < closestDistance) {
			closestDistance = distance;
			closestName = name;
		}
	}

	return closestName ? { name: closestName } : undefined;
};

/** gets the nearest hexColor name and checks for invalid ones */
const getClosestColor = (inputColorHex: string) => {
	try {
		return closestColor(inputColorHex.substring(0, 7))?.name;
	} catch (error) {
		console.error(error);
		return '[unknownColor]'; // or a fallback hexColor like `colors.white`
	}
};
/** get the customColor */
const createCustomColor = (inputColorHex: string, preName?: string): CustomColor => {
	const closestColorName = getClosestColor(inputColorHex);
	return {
		name: preName ?? (closestColorName === undefined ? inputColorHex.substring(0, 7) : gruntStrings.capitalize(closestColorName)),
		color: inputColorHex.substring(0, 9),
	};
};

/**
 * Lightens a given hex hexColor by a specified fraction.
 *
 * @param hexColor - A hex hexColor string (with or without a '#' prefix).
 * @param amount - A fraction between 0 and 1 indicating how much to lighten the hexColor.
 * @returns The lightened hexColor in hex format.
 */
const lightenColor = (hexColor: string, amount: number): string => {
	const hex = hexToRgbaArray(hexColor);
	const [r, g, b, a] = hex;

	const newR = Math.round(r + (255 - r) * amount);
	const newG = Math.round(g + (255 - g) * amount);
	const newB = Math.round(b + (255 - b) * amount);

	const rgbaString = `rgba(${newR},${newG},${newB},${a})`;

	const newColor = rgbaToHex(rgbaString);
	return `${newColor}`;
};

/**
 * Darkens a given hex by a specified fraction.
 *
 * @param hexColor - A hex string (with or without a '#' prefix).
 * @param amount - A fraction between 0 and 1 indicating how much to darken the hexColor.
 * @returns {string} The darkened hexColor in hex format.
 */
const darkenColor = (hexColor: string, amount: number): string => {
	const hex = hexToRgbaArray(hexColor);
	const [r, g, b, a] = hex;

	const newR = Math.round(r * (1 - amount));
	const newG = Math.round(g * (1 - amount));
	const newB = Math.round(b * (1 - amount));

	const rgbaString = `rgba(${newR},${newG},${newB},${a})`;

	const newColor = rgbaToHex(rgbaString);
	return `${newColor}`;
};

function invertHexColor(hexColor: string): string {
	const hex = hexToRgbaArray(hexColor, 1);
	const [r, g, b] = hex;

	// Invert each component
	const invertedR = 255 - r;
	const invertedG = 255 - g;
	const invertedB = 255 - b;

	// Convert back to hex (without bitwise)
	const invertedHex = `0${invertedR.toString(16)}`.slice(-2) + `0${invertedG.toString(16)}`.slice(-2) + `0${invertedB.toString(16)}`.slice(-2);

	return `#${invertedHex}`;
}

function invertHexColorToBW(hexColor: string, threshold = 128): string {
	const hex = hexToRgbaArray(hexColor);

	let [r, g, b, a] = hex;

	// change a to 1 if changed is true
	if (a === 0) a = 1;

	// Calculate brightness using the luminance formula
	const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

	// Blend with white background based on alpha
	const blendedBrightness = brightness * a + 255 * (1 - a);
	// Threshold to black or white based on blended brightness
	return blendedBrightness > threshold ? '#000000' : '#ffffff';
}
const blindingColors = { allColorValues, colorValues, darkenColor, getClosestColor, getCustomColor: createCustomColor, getRandomColor, hexToRgba, invertHexColor, invertHexColorToBW, lightenColor, rgbaToHex };
export default blindingColors;
export { allColorValues, colorValues, darkenColor, getClosestColor, createCustomColor as getCustomColor, getRandomColor, hexToRgba, invertHexColor, invertHexColorToBW, lightenColor, rgbaToHex };
