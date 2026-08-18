import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { StyleSheet, Text, View } from 'react-native';

const { colors } = dragonTheme;

export function BottomTabIcon({ symbol, label, focused, warning = false }: { symbol: string; label: string; focused: boolean; warning?: boolean }) {
	return (
		<View style={styles.wrap}>
			<Text style={[styles.symbol, focused && styles.focused]}>{symbol}</Text>
			{warning ? <View accessibilityLabel="New page unlocked" style={styles.warning}><Text style={styles.warningText}>!</Text></View> : null}
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
	warning: { position: 'absolute', top: -2, right: 8, width: 15, height: 15, borderRadius: 8, backgroundColor: colors.gold, borderColor: colors.canvas, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
	warningText: { color: colors.canvas, fontFamily: appFonts.bold, fontSize: 9, lineHeight: 11 },
});
