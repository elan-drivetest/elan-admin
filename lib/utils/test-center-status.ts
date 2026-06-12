// lib/utils/test-center-status.ts
import type { TestCenter } from '@/types/admin';

// The public list endpoint (GET /drive-test-centers) does not return `status`,
// so the settings page tracks toggles in localStorage under this key. Status
// resolution = local override → server `status` (only present on PUT) → ACTIVE.
const STORAGE_KEY = 'tc_status';

export function getTestCenterStatusMap(): Record<number, string> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function resolveTestCenterStatus(
  center: Pick<TestCenter, 'id' | 'status'>,
  map: Record<number, string> = getTestCenterStatusMap(),
): string {
  return map[center.id] ?? center.status ?? 'ACTIVE';
}

export function isTestCenterActive(
  center: Pick<TestCenter, 'id' | 'status'>,
  map?: Record<number, string>,
): boolean {
  return resolveTestCenterStatus(center, map) === 'ACTIVE';
}
