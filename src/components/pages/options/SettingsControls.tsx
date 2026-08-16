import { Chip, ProgressBar } from '@/components/ui/DragonUI';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

const { colors, space } = dragonTheme;

export function SettingSlider({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
	const [width, setWidth] = useState(1);
	const normalized = Math.max(0, Math.min(1, value));
	const setFromPress = (locationX: number) => onChange(Math.max(0, Math.min(1, locationX / width)));
	return (
		<View style={styles.sliderGroup}>
			<View style={styles.header}>
				<Text style={styles.label}>{label}</Text>
				<Text style={styles.value}>{Math.round(normalized * 100)}%</Text>
			</View>
			<Pressable
				accessibilityRole="adjustable"
				accessibilityLabel={label}
				accessibilityValue={{ min: 0, max: 100, now: Math.round(normalized * 100) }}
				onAccessibilityAction={event => onChange(normalized + (event.nativeEvent.actionName === 'increment' ? 0.05 : -0.05))}
				accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
				onLayout={(event: LayoutChangeEvent) => setWidth(Math.max(1, event.nativeEvent.layout.width))}
				onPress={event => setFromPress(event.nativeEvent.locationX)}
				style={styles.slider}>
				<ProgressBar value={normalized * 100} color={colors.gold} />
			</Pressable>
			<View style={styles.scale}><Text style={styles.scaleText}>0</Text><Text style={styles.scaleText}>Tap the track to adjust</Text><Text style={styles.scaleText}>100</Text></View>
		</View>
	);
}

export function ToggleRow({ label, detail, value, onChange }: { label: string; detail?: string; value: boolean; onChange: (value: boolean) => void }) {
	return (
		<View style={styles.toggleRow}>
			<View style={styles.copy}><Text style={styles.label}>{label}</Text>{detail ? <Text style={styles.detail}>{detail}</Text> : null}</View>
			<Chip label={value ? 'On' : 'Off'} selected={value} onPress={() => onChange(!value)} />
		</View>
	);
}

const styles = StyleSheet.create({
	sliderGroup: { gap: space.sm, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: space.md },
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
	label: { color: colors.ink, fontFamily: appFonts.medium, fontSize: 13 },
	value: { color: colors.gold, fontFamily: appFonts.mono, fontSize: 12 },
	slider: { minHeight: 30, justifyContent: 'center' },
	scale: { flexDirection: 'row', justifyContent: 'space-between' },
	scaleText: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 9 },
	toggleRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, borderTopColor: colors.line, borderTopWidth: 1, paddingTop: space.sm },
	copy: { flex: 1, gap: 2 },
	detail: { color: colors.muted, fontFamily: appFonts.regular, fontSize: 10, lineHeight: 15 },
});
