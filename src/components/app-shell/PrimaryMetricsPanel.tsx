import { displayFuryStage } from '@/components/ui/fury-display';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import { useProductionSpecialStore } from '@/store/store-production-special/_useProductionSpecialStore';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { formatDecimal } from '@/utils/decimal';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

const { colors, space } = dragonTheme;

type MetricEntry = { id: string; label: string; value: string; icon: string; color: string; description: string };

export function PrimaryMetricsPanel() {
	const { resources, dragon, angerShields, getFuryBand } = useWorldStore(useShallow(state => ({
		resources: state.resourceStore.resources,
		dragon: state.resourceStore.dragon,
		angerShields: state.dragonStore.angerShields,
		getFuryBand: state.dragonStore.getFuryBand,
	})));
	const heart = useProductionSpecialStore(useShallow(state => ({ charge: state.crimsonHeart.charge, getMaximumCharge: state.crimsonHeart.getMaximumCharge })));
	const [selectedId, setSelectedId] = useState<string>();
	const furyStage = displayFuryStage(getFuryBand(), angerShields);
	const heartMultiplier = Math.max(0, heart.charge);
	const maximumHeart = heart.getMaximumCharge();
	const entries: readonly MetricEntry[] = [
		{ id: 'shards', label: 'Shards', value: formatDecimal(resources.shards), icon: '◆', color: colors.gold, description: 'Crimson Shards are a flexible meta-currency used in the Black Market, selected unlocks, and defenses such as Anger Shields.' },
		{ id: 'heart', label: 'Heart Multiplier', value: `×${formatDecimal(heartMultiplier, 3)}`, icon: '♥', color: colors.crimsonBright, description: `The Crimson Heart applies a ×${formatDecimal(heartMultiplier, 3)} tick multiplier to Energy and Population while active. The default Pomodoro target is ×100; anomaly upgrades can raise the current target to ×${maximumHeart.toFixed(1)}.` },
		{ id: 'fury', label: 'Dragon Fury', value: `${furyStage} · ${formatDecimal(resources.fury)}`, icon: '🔥', color: '#FFB5A7', description: `The dragon is ${furyStage} at ${formatDecimal(resources.fury)} / ${formatDecimal(dragon.furyThreshold)} Fury. Shields can keep the stage Calm; Angry and Critical Fury stop Population growth and cause losses.` },
	];
	const selectedEntry = entries.find(entry => entry.id === selectedId);

	return (
		<View style={styles.panel}>
			<View style={styles.grid}>
				{entries.map(entry => (
					<Pressable
						key={entry.id}
						accessibilityRole="button"
						accessibilityLabel={`${entry.label}, ${entry.value}`}
						accessibilityState={{ selected: selectedId === entry.id }}
						onPress={() => setSelectedId(current => current === entry.id ? undefined : entry.id)}
						style={[styles.item, selectedId === entry.id && { borderBottomColor: entry.color }, selectedId === entry.id && styles.selected]}>
						<Text style={[styles.icon, { color: entry.color }]}>{entry.icon}</Text>
						<View style={styles.copy}>
							<Text numberOfLines={2} adjustsFontSizeToFit style={styles.label}>{entry.label}</Text>
							<Text numberOfLines={1} adjustsFontSizeToFit style={[styles.value, { color: entry.color }]}>{entry.value}</Text>
						</View>
					</Pressable>
				))}
			</View>
			{selectedEntry ?
				<View style={styles.description}>
					<Text style={[styles.descriptionTitle, { color: selectedEntry.color }]}>{selectedEntry.icon} {selectedEntry.label}</Text>
					<Text style={styles.descriptionText}>{selectedEntry.description}</Text>
				</View>
			: null}
		</View>
	);
}

const styles = StyleSheet.create({
	panel: { minHeight: 68, backgroundColor: colors.surfaceRaised, borderBottomColor: colors.line, borderBottomWidth: 1, paddingHorizontal: space.lg, paddingVertical: space.sm },
	grid: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch', gap: space.sm },
	item: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 2, paddingVertical: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
	selected: { backgroundColor: colors.canvasRaised },
	icon: { width: 18, fontSize: 16, textAlign: 'center' },
	copy: { flex: 1, minWidth: 0, alignItems: 'flex-start', gap: 1 },
	label: { width: '100%', color: colors.muted, fontFamily: appFonts.medium, fontSize: 8, lineHeight: 11, letterSpacing: 0.2, textTransform: 'uppercase' },
	value: { width: '100%', fontFamily: appFonts.bold, fontSize: 11 },
	description: { borderTopColor: colors.line, borderTopWidth: 1, marginTop: space.xs, paddingTop: space.sm, paddingBottom: space.xs },
	descriptionTitle: { fontFamily: appFonts.bold, fontSize: 12 },
	descriptionText: { color: colors.ink, fontFamily: appFonts.regular, fontSize: 11, lineHeight: 16, marginTop: 2 },
});
