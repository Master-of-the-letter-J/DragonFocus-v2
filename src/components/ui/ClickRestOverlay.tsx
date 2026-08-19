import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import type { ClickRestState } from '@/store/store-world/createDragonSlice';
import { formatDecimal } from '@/utils/decimal';
import { StyleSheet, Text, View } from 'react-native';

const { colors, radius, space } = dragonTheme;

export function ClickRestOverlay({ label, rest }: { label: string; rest: ClickRestState }) {
	if (rest.ticksRemaining > 0) {
		return (
			<View pointerEvents="none" style={styles.locked}>
				<Text style={styles.lockIcon}>🔒</Text>
				<Text style={styles.lockTitle}>{label} resting</Text>
				<Text style={styles.lockCounter}>{formatDecimal(Math.ceil(rest.ticksRemaining), 0)} rest ticks remaining</Text>
				<Text style={styles.lockDetail}>The Crimson Heart multiplier speeds this up. A Pomodoro clears it much faster.</Text>
			</View>
		);
	}

	return (
		<View pointerEvents="none" style={styles.allowance}>
			<Text style={styles.allowanceText}>⛓ {rest.clicksRemaining} clicks before rest</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	allowance: {
		position: 'absolute',
		top: space.sm,
		zIndex: 5,
		backgroundColor: '#0C0910E8',
		borderColor: colors.line,
		borderWidth: 1,
		borderRadius: radius.pill,
		paddingHorizontal: space.md,
		paddingVertical: 6,
	},
	allowanceText: { color: colors.gold, fontFamily: appFonts.semibold, fontSize: 11, textAlign: 'center' },
	locked: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		zIndex: 10,
		alignItems: 'center',
		justifyContent: 'center',
		gap: space.sm,
		padding: space.xl,
		backgroundColor: '#08060BEF',
		borderColor: colors.crimsonBright,
		borderWidth: 1,
		borderRadius: radius.large,
	},
	lockIcon: { fontSize: 40 },
	lockTitle: { color: colors.ink, fontFamily: appFonts.black, fontSize: 20, textAlign: 'center', textTransform: 'uppercase' },
	lockCounter: { color: colors.gold, fontFamily: appFonts.bold, fontSize: 15, textAlign: 'center' },
	lockDetail: { maxWidth: 300, color: colors.muted, fontFamily: appFonts.regular, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
