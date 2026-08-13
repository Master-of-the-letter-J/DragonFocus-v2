import type { AchievementDefinition, AchievementMetric } from '@/data/statistics-data/achievements';
import { decimal, type DecimalSource } from '@/utils/decimal';

export const achievementReached = (value: DecimalSource, achievement: AchievementDefinition) => decimal(value).gte(achievement.target);

export const unlockedAchievements = (achievements: readonly AchievementDefinition[], unlockedIds: readonly string[], getMetricValue: (metric: AchievementMetric) => DecimalSource) => achievements.filter(achievement => !unlockedIds.includes(achievement.id) && achievementReached(getMetricValue(achievement.metric), achievement));

export const dragonRespawnCount = (graveyard: readonly { revivedAt?: string }[]) => graveyard.filter(entry => Boolean(entry.revivedAt)).length;
