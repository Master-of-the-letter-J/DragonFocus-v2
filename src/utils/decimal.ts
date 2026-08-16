import Decimal from 'break_infinity.js';

export { Decimal };

export type DecimalSource = Decimal | number | string;

export const decimal = (value: DecimalSource = 0): Decimal => (value instanceof Decimal ? value : new Decimal(value));

export const decimalZero = () => new Decimal(0);

export const decimalMax = (left: DecimalSource, right: DecimalSource) => Decimal.max(decimal(left), decimal(right));

export const decimalMin = (left: DecimalSource, right: DecimalSource) => Decimal.min(decimal(left), decimal(right));

export const serializeDecimal = (value: DecimalSource) => decimal(value).toString();

export const deserializeDecimal = (value: unknown, fallback: DecimalSource = 0) => {
	if (value instanceof Decimal || typeof value === 'number' || typeof value === 'string') {
		return decimal(value);
	}

	return decimal(fallback);
};

export type DecimalFormatStyle = 'short' | 'expanded-short' | 'long' | 'scientific';
let defaultDecimalFormat: DecimalFormatStyle = 'expanded-short';
export const setDefaultDecimalFormat = (style: DecimalFormatStyle) => {
	defaultDecimalFormat = style;
};

export const formatDecimal = (value: DecimalSource, digits = 2, style: DecimalFormatStyle = defaultDecimalFormat) => {
	const amount = decimal(value);
	if (amount.eq(0)) return '0';
	if (style === 'scientific') return amount.toPrecision(Math.max(2, digits + 1)).replace('+', '');
	if (amount.abs().lt(1_000) && amount.exponent > -4) {
		return amount.toNumber().toLocaleString('en-US', { maximumFractionDigits: digits });
	}
	const shortUnits = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
	const longUnits = ['', 'Thousand', 'Million', 'Billion', 'Trillion', 'Quadrillion', 'Quintillion', 'Sextillion', 'Septillion', 'Octillion', 'Nonillion', 'Decillion'];
	const naturalIndex = Math.floor(amount.abs().exponent / 3);
	const unitIndex = style === 'expanded-short' ? Math.max(1, naturalIndex - 1) : naturalIndex;
	if (unitIndex >= shortUnits.length) return amount.toPrecision(Math.max(2, digits + 1)).replace('+', '');
	const scaled = amount.div(decimal(10).pow(unitIndex * 3)).toNumber().toLocaleString('en-US', { maximumFractionDigits: digits });
	return style === 'long' ? `${scaled} ${longUnits[unitIndex]}` : `${scaled}${style === 'expanded-short' ? ' ' : ''}${shortUnits[unitIndex]}`;
};
