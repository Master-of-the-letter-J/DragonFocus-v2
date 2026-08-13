import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { StyleSheet, Text, View } from 'react-native';

const { colors } = dragonTheme;

export function BottomTabIcon({ symbol, label, focused }: { symbol: string; label: string; focused: boolean }) {
	return (
		<View style={styles.wrap}>
			<Text style={[styles.symbol, focused && styles.focused]}>{symbol}</Text>
			<Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
			{focused ?
				<View style={styles.dot} />
			:	null}
		</View>
	);
}

const styles = StyleSheet.create({
	wrap: { alignItems: 'center', justifyContent: 'center', gap: 1, minWidth: 62 },
	symbol: { color: colors.muted, fontSize: 20 },
	focused: { color: colors.crimsonBright },
	label: { color: colors.muted, fontFamily: appFonts.medium, fontSize: 9 },
	labelFocused: { color: colors.ink },
	dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold, position: 'absolute', bottom: -5 },
});
