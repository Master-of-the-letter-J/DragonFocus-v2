import { SurveyPage } from '@/components/features/surveys/SurveyPage';
import { milestoneForEnergy } from '@/data/world-data/milestones';
import { useWorldStore } from '@/store/store-world/_useWorldStore';
import { Redirect } from 'expo-router';

export default function CheckOutSurveyRoute() {
	const totalEnergy = useWorldStore(state => state.resourceStore.totalAllTime.energy);
	const dragonSpawned = useWorldStore(state => state.dragonStore.dragonSpawned);
	if (!dragonSpawned || milestoneForEnergy(totalEnergy) < 0.5) return <Redirect href="/(_tabs)/lair?tab=nexus" />;
	return <SurveyPage kind="check-out" />;
}
