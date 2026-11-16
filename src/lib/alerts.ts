export const ALERT_COOLDOWN_MS = 3 * 60 * 60 * 1000;

/**
 * Notify only when the air *turns* clean: the previous reading was above the threshold,
 * the new one is at or below it, and we haven't notified in the last 3 hours.
 * With no previous reading we just record it (no alert).
 */
export function shouldNotify(args: {
  prevAqi: number | undefined;
  aqi: number;
  threshold: number;
  lastNotifiedAt: number | undefined;
  now: number;
}) {
  const { prevAqi, aqi, threshold, lastNotifiedAt, now } = args;
  if (prevAqi === undefined) return false;
  if (aqi > threshold) return false;
  if (prevAqi <= threshold) return false;
  if (lastNotifiedAt !== undefined && now - lastNotifiedAt < ALERT_COOLDOWN_MS) return false;
  return true;
}
