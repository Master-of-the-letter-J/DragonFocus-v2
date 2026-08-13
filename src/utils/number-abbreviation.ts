import { decimal, type DecimalSource } from '@/utils/decimal';

const ABBREVIATION_STEPS = [
	{ suffix: 'K', divisor: 1_000, threshold: 100_000 },
	{ suffix: 'M', divisor: 1_000_000, threshold: 100_000_000 },
	{ suffix: 'B', divisor: 1_000_000_000, threshold: 100_000_000_000 },
	{ suffix: 'T', divisor: 1_000_000_000_000, threshold: 100_000_000_000_000 },
	{ suffix: 'q', divisor: 1_000_000_000_000_000, threshold: 100_000_000_000_000_000 },
	{ suffix: 'Q', divisor: 1_000_000_000_000_000_000, threshold: 100_000_000_000_000_000_000 },
	{ suffix: 's', divisor: 1_000_000_000_000_000_000_000, threshold: 100_000_000_000_000_000_000_000 },
	{ suffix: 'S', divisor: 1_000_000_000_000_000_000_000_000, threshold: 100_000_000_000_000_000_000_000_000 },
	{ suffix: 'N', divisor: 1_000_000_000_000_000_000_000_000_000, threshold: 100_000_000_000_000_000_000_000_000_000 },
	{ suffix: 'D', divisor: 1_000_000_000_000_000_000_000_000_000_000, threshold: 100_000_000_000_000_000_000_000_000_000_000 },
] as const;

export type NumberFormatStyle = 'short' | 'expanded-short' | 'long' | 'scientific';

export interface NumberFormatOptions {
	style: NumberFormatStyle;
	maximumFractionDigits?: number;
	abbreviateBelow?: number;
}

export const NUMBER_FORMAT_OPTIONS: { id: NumberFormatStyle; label: string; description: string }[] = [
	{ id: 'short', label: 'K, M, B, T', description: 'Compact suffixes for large values.' },
	{ id: 'expanded-short', label: '1,000 K', description: 'Keeps the previous suffix until the next thousand.' },
	{ id: 'long', label: 'Million, Billion, Trillion', description: 'Spelled-out large-number units.' },
	{ id: 'scientific', label: 'Scientific', description: 'Exponent notation for very large values.' },
];

const shortUnits = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
const longUnits = ['', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion', 'Quintillion', 'Sextillion', 'Septillion', 'Octillion', 'Nonillion', 'Decillion'];

export const formatGameNumber = (value: DecimalSource, options: NumberFormatOptions = { style: 'short' }) => {
	const amount = decimal(value);
	if (amount.eq(0)) return '0';
	const fractionDigits = Math.max(0, options.maximumFractionDigits ?? 2);
	const threshold = Math.max(1, options.abbreviateBelow ?? 1_000);
	const sign = amount.lt(0) ? '-' : '';
	const absolute = amount.abs();
	if (options.style === 'scientific') return `${sign}${absolute.toPrecision(fractionDigits + 1).replace('+', '')}`;
	if (absolute.lt(threshold)) return `${sign}${absolute.toNumber().toLocaleString('en-US', { maximumFractionDigits: fractionDigits })}`;
	const unitIndex = options.style === 'expanded-short' ? Math.max(1, Math.floor(absolute.exponent / 3) - 1) : Math.floor(absolute.exponent / 3);
	if (unitIndex <= 0) return `${sign}${absolute.toNumber().toLocaleString('en-US', { maximumFractionDigits: fractionDigits })}`;
	if (unitIndex >= shortUnits.length) return `${sign}${absolute.toPrecision(fractionDigits + 1).replace('+', '')}`;
	const scaled = absolute
		.div(decimal(10).pow(unitIndex * 3))
		.toNumber()
		.toLocaleString('en-US', { maximumFractionDigits: fractionDigits });
	if (options.style === 'long') return `${sign}${scaled} ${longUnits[unitIndex]}`;
	if (options.style === 'expanded-short') return `${sign}${scaled} ${shortUnits[unitIndex]}`;
	return `${sign}${scaled}${shortUnits[unitIndex]}`;
};

const formatInteger = (value: number) => {
	return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value));
};

export const roundToDecimalPlaces = (value: number, places = 3) => {
	if (!Number.isFinite(value)) return 0;
	const factor = Math.pow(10, places);
	return Math.round(value * factor) / factor;
};

export const formatDecimalNumber = (value: number, maximumFractionDigits = 3) => {
	if (!Number.isFinite(value)) return '0';
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 0,
		maximumFractionDigits,
	}).format(value);
};

export const formatCoinNumber = (value: number, fixedCentsBelowThreshold = false) => {
	if (!Number.isFinite(value)) return '0';
	const absoluteValue = Math.abs(value);
	if (absoluteValue < 100_000) {
		return new Intl.NumberFormat('en-US', {
			minimumFractionDigits: fixedCentsBelowThreshold ? 2 : 0,
			maximumFractionDigits: 2,
		}).format(value);
	}
	return formatAbbreviatedNumber(value);
};

export const formatAbbreviatedNumber = (value: number, minimumThreshold = 100_000) => {
	if (!Number.isFinite(value)) return '0';

	const sign = value < 0 ? '-' : '';
	const absoluteValue = Math.abs(value);

	if (absoluteValue < minimumThreshold) {
		return `${sign}${formatInteger(absoluteValue)}`;
	}

	const matchingStep = [...ABBREVIATION_STEPS].reverse().find(step => absoluteValue >= step.threshold);
	if (!matchingStep) {
		return `${sign}${formatInteger(absoluteValue)}`;
	}

	if (matchingStep.suffix === 'D' && absoluteValue >= matchingStep.threshold * 1000) {
		return `${sign}${absoluteValue.toExponential(2).replace('+', '')}`;
	}

	return `${sign}${formatInteger(absoluteValue / matchingStep.divisor)}${matchingStep.suffix}`;
};

export const formatPopulationNumber = (value: number) => {
	if (!Number.isFinite(value)) return '0';
	if (Math.abs(value) >= 1_000_000_000_000) {
		return value.toExponential(2).replace('+', '');
	}
	return formatAbbreviatedNumber(value, 100_000_000_000_000);
};
