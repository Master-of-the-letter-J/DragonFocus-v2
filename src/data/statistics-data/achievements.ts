export type AchievementMetric = 'checkIn' | 'checkOut' | 'goals' | 'pomodoroMinutes' | 'energy' | 'darkEnergy' | 'plasma' | 'anomaly' | 'streak' | 'armageddon' | 'transcension';

export interface AchievementDefinition {
	id: string;
	title: string;
	description: string;
	metric: AchievementMetric;
	target: number;
	shards: number;
	secret?: boolean;
}

const milestones = [1, 3, 5, 10, 25, 50, 100, 250] as const;
const metricDefinitions: { metric: AchievementMetric; title: string; description: string }[] = [
	{ metric: 'checkIn', title: 'Morning Briefing', description: 'Complete check-in surveys.' },
	{ metric: 'checkOut', title: 'Evening Debrief', description: 'Complete check-out surveys.' },
	{ metric: 'goals', title: 'Focused Finisher', description: 'Harvest completed goals.' },
	{ metric: 'pomodoroMinutes', title: 'Time Keeper', description: 'Accumulate focused minutes.' },
	{ metric: 'energy', title: 'Grid Operator', description: 'Reach total energy milestones.' },
	{ metric: 'darkEnergy', title: 'Dark Scholar', description: 'Reach dark energy milestones.' },
	{ metric: 'plasma', title: 'Plasma Pioneer', description: 'Reach plasma milestones.' },
	{ metric: 'anomaly', title: 'Anomaly Seeker', description: 'Reach anomaly milestones.' },
	{ metric: 'streak', title: 'Crimson Rhythm', description: 'Build a habit streak.' },
	{ metric: 'armageddon', title: 'World Breaker', description: 'Commit Armageddon.' },
	{ metric: 'transcension', title: 'Beyond the World', description: 'Transcend the current world.' },
];

export const ACHIEVEMENTS: AchievementDefinition[] = metricDefinitions
	.flatMap(({ metric, title, description }): AchievementDefinition[] =>
		milestones.map((target, index): AchievementDefinition => ({
			id: `${metric}-${target}`,
			title: `${title} ${index + 1}`,
			description: `${description} Target: ${target.toLocaleString()}.`,
			metric,
			target,
			shards: Math.max(1, Math.ceil((index + 1) / 2)),
		})),
	)
	.concat([
		{ id: 'secret-unbroken-year', title: 'Unbroken Year', description: 'Maintain a 365-day habit streak.', metric: 'streak', target: 365, shards: 50, secret: true },
		{ id: 'secret-deep-focus', title: 'Deep Focus', description: 'Accumulate 10,000 Pomodoro minutes.', metric: 'pomodoroMinutes', target: 10_000, shards: 50, secret: true },
		{ id: 'secret-cosmic-grid', title: 'Cosmic Grid', description: 'Reach 1e100 total energy.', metric: 'energy', target: 1e100, shards: 50, secret: true },
	]);
