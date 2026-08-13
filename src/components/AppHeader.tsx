import { useGoalStore } from '@/store/store-productivity/createGoalSlice';
import { useResourceStore } from '@/store/store-world/createResourceSlice';
import { formatDecimal } from '@/utils/decimal';
import { StyleSheet, Text, View } from 'react-native';

export function AppHeader() {
	const resources = useResourceStore(state => state.resources);
	const dragon = useResourceStore(state => state.dragon);
	const habits = useGoalStore(state => state.incompleteHabits.length);
	const tasks = useGoalStore(state => state.incompleteTasks.length);

	return (
		<View style={styles.shell}>
			<View>
				<Text style={styles.title}>Dragon Focus</Text>
				<Text style={styles.subtitle}>
					{dragon.name} · {dragon.stage.replace('-', ' ')}
				</Text>
			</View>
			<View style={styles.stats}>
				<Text style={styles.stat}>⚡ {formatDecimal(resources.energy)}</Text>
				<Text style={styles.stat}>◈ {formatDecimal(resources.darkEnergy)}</Text>
				<Text style={styles.stat}>
					🔥 {formatDecimal(resources.fury)} / {formatDecimal(dragon.furyThreshold)}
				</Text>
				<Text style={styles.stat}>
					{habits} habits · {tasks} tasks
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	shell: { backgroundColor: '#171122', paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
	title: { color: '#fff7ed', fontSize: 20, fontWeight: '800' },
	subtitle: { color: '#c4b5fd', fontSize: 12, textTransform: 'capitalize', marginTop: 2 },
	stats: { alignItems: 'flex-end', gap: 2 },
	stat: { color: '#f5f3ff', fontSize: 11, fontWeight: '600' },
});
