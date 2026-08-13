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

export const formatDecimal = (value: DecimalSource, digits = 2) => {
	const amount = decimal(value);
	if (amount.eq(0)) return '0';
	if (amount.exponent < 6 && amount.exponent > -4) {
		return amount.toNumber().toLocaleString('en-US', { maximumFractionDigits: digits });
	}

	return amount.toPrecision(Math.max(2, digits + 1)).replace('+', '');
};
