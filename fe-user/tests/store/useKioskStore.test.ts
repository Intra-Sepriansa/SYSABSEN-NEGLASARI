import { describe, it, expect, beforeEach } from 'vitest';
import { useKioskStore } from '../../src/store/useKioskStore';

describe('useKioskStore', () => {
  beforeEach(() => {
    useKioskStore.getState().reset();
  });

  it('pushAttendance should mark success by default', () => {
    useKioskStore.getState().pushAttendance(
      {
        id: 1,
        name: 'Test User',
        type: 'in',
        tapTime: new Date().toISOString()
      },
      42
    );

    const state = useKioskStore.getState();
    expect(state.status).toBe('SUCCESS');
    expect(state.history).toHaveLength(1);
    expect(state.latencyMs).toBe(42);
  });

  it('pushAttendance sets LATE when flags.late is true', () => {
    useKioskStore.getState().pushAttendance(
      {
        id: 2,
        name: 'Late User',
        type: 'in',
        tapTime: new Date().toISOString(),
        flags: { late: true }
      },
      10
    );

    expect(useKioskStore.getState().status).toBe('LATE');
  });
});
