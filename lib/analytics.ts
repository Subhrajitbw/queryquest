import { differenceInDays, isSameDay, startOfDay, subDays } from 'date-fns';

export function calculateStreak(activities: { date: Date; actionsCount: number }[]): number {
  if (activities.length === 0) return 0;

  // Sort activities by date descending
  const sorted = [...activities].sort((a, b) => b.date.getTime() - a.date.getTime());

  let streak = 0;
  let currentDate = startOfDay(new Date());

  // Check if the most recent activity is today or yesterday
  const lastActivityDate = startOfDay(sorted[0].date);
  const diff = differenceInDays(currentDate, lastActivityDate);

  if (diff > 1) return 0; // Streak broken

  if (diff === 1) {
    // Last activity was yesterday, streak continues if we find it
    currentDate = lastActivityDate;
  } else {
    // Last activity was today
    currentDate = lastActivityDate;
  }

  for (const activity of sorted) {
    const activityDate = startOfDay(activity.date);
    if (isSameDay(activityDate, currentDate)) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else if (differenceInDays(currentDate, activityDate) > 0) {
      // Gap found, streak ends
      break;
    }
  }

  return streak;
}
