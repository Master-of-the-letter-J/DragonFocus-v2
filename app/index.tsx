import { Redirect } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

export default function Index() {
	const hasEntered = useAppStore(state => state.hasEntered);
	return <Redirect href={hasEntered ? '/(_tabs)/earth' : '/landing'} />;
}
