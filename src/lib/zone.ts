import type { DangerZone } from './types';

export function detectionZone(score: number): DangerZone {
  if (score <= 0.3) return 'safe';
  if (score <= 0.6) return 'watch';
  return 'danger';
}
