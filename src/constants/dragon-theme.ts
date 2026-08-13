export const dragonTheme = {
	colors: {
		ink: '#F8F3E8',
		muted: '#A9A2B5',
		canvas: '#09070D',
		canvasRaised: '#100D17',
		surface: '#17121F',
		surfaceRaised: '#21182B',
		line: '#352640',
		lineStrong: '#5A3A5C',
		crimson: '#C5414D',
		crimsonBright: '#F06A62',
		crimsonSoft: '#3A171F',
		gold: '#E0A84B',
		goldSoft: '#3D2B17',
		violet: '#A985E8',
		green: '#61C69D',
		blue: '#66A7E8',
		danger: '#E45C66',
	},
	radius: { small: 10, medium: 16, large: 24, pill: 999 },
	space: { xs: 4, sm: 8, md: 12, lg: 18, xl: 24, xxl: 32 },
} as const;

export const appFonts = {
	regular: 'Poppins-Regular',
	medium: 'Poppins-Medium',
	semibold: 'Poppins-SemiBold',
	bold: 'Poppins-Bold',
	black: 'Poppins-Black',
	mono: 'SpaceMono',
} as const;
