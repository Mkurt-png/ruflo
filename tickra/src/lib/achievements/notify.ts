// Discord notification helper for fresh achievement unlocks. Pure name
// resolution — never leaks email, falls back to "An apprentice".

import { postDiscord } from '@/lib/notify/discord';
import { getAchievement } from './catalog';

export function formatAchievement({
  displayName,
  achievementTitle,
}: {
  displayName?: string | null;
  achievementTitle: string;
}): string {
  const who = displayName?.trim() || 'An apprentice';
  return `🏆 New achievement: **${who}** just unlocked "${achievementTitle}".`;
}

export async function notifyAchievements(
  freshIds: string[],
  displayName: string | null,
): Promise<void> {
  for (const id of freshIds) {
    const a = getAchievement(id);
    if (!a) continue;
    await postDiscord(
      'signups',
      formatAchievement({ displayName, achievementTitle: a.title.en }),
    ).catch(() => undefined);
  }
}
