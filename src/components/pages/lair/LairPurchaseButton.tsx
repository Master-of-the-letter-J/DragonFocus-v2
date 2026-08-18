import { ActionButton, uiStyles } from '@/components/ui/DragonUI';
import { appFonts, dragonTheme } from '@/constants/dragon-theme';
import type { ResourceAmounts } from '@/types/resources.types';
import { formatDecimal } from '@/utils/decimal';
import type Decimal from 'break_infinity.js';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const { colors, radius, space } = dragonTheme;

const resourceNames: Record<string, string> = {
	energy: 'Energy',
	darkEnergy: 'Dark Energy',
	plasma: 'Plasma',
	darkPlasma: 'Dark Plasma',
	anomaly: 'Anomaly',
	shards: 'Shards',
	quarks: 'Quarks',
};

type PurchaseCosts = Partial<Record<string, Decimal>>;

export const formatPurchaseCosts = (costs: PurchaseCosts) => Object.entries(costs)
	.filter(([, amount]) => amount)
	.map(([resource, amount]) => `${formatDecimal(amount!)} ${resourceNames[resource] ?? resource}`)
	.join(' · ');

export const missingPurchaseCosts = (costs: PurchaseCosts, resources: ResourceAmounts) => Object.entries(costs)
	.flatMap(([resource, amount]) => {
		if (!amount) return [];
		const current = resources[resource as keyof ResourceAmounts];
		if (!current || current.gte(amount)) return [];
		return [`Need ${formatDecimal(amount.minus(current))} more ${resourceNames[resource] ?? resource}`];
	});

export function LairPurchaseButton({ label, compact = false, disabled = false, missing, onPress }: { label: string; compact?: boolean; disabled?: boolean; missing: readonly string[]; onPress: () => void }) {
	const [visible, setVisible] = useState(false);
	const reason = missing.length ? missing : ['This purchase is not available right now.'];
	return (
		<>
			<ActionButton compact={compact} label={label} disabled={disabled} onDisabledPress={() => setVisible(true)} onPress={onPress} />
			<Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
				<Pressable style={styles.scrim} onPress={() => setVisible(false)}>
					<Pressable style={styles.dialog} onPress={event => event.stopPropagation()}>
						<Text style={styles.title}>Cannot purchase yet</Text>
						<Text style={uiStyles.muted}>You need the following before this purchase is available:</Text>
						<View style={styles.requirements}>
							{reason.map(requirement => <Text key={requirement} style={styles.requirement}>• {requirement}</Text>)}
						</View>
						<ActionButton compact label="Close" onPress={() => setVisible(false)} />
					</Pressable>
				</Pressable>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	scrim: { flex: 1, backgroundColor: '#050308E8', justifyContent: 'center', padding: space.lg },
	dialog: { backgroundColor: colors.canvasRaised, borderColor: colors.lineStrong, borderWidth: 1, borderRadius: radius.large, padding: space.lg, gap: space.md },
	title: { color: colors.ink, fontFamily: appFonts.bold, fontSize: 19 },
	requirements: { gap: space.xs },
	requirement: { color: colors.gold, fontFamily: appFonts.semibold, fontSize: 13, lineHeight: 19 },
});
