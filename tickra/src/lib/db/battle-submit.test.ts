import { describe, it, expect, vi, beforeEach } from 'vitest';

// submitAnswer goes through the database function from migration 024 and
// falls back to the old read-modify-write only while that function does not
// exist. What must not happen: falling back on OTHER errors, which would
// quietly reintroduce the race and the browser-reported timing.

const rpc = vi.fn();
const single = vi.fn();
const db = {
  rpc,
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: single, single }) }),
    update: () => ({ eq: () => ({ select: () => ({ single }) }) }),
  }),
};
vi.mock('./supabase', () => ({ getDb: async () => db, isDbConfigured: () => true }));

const { submitAnswer } = await import('./battle-queries');

describe('submitAnswer', () => {
  beforeEach(() => {
    rpc.mockReset();
    single.mockReset();
  });

  it('uses the database function, without the browser time', async () => {
    rpc.mockResolvedValue({ data: { id: 'b1', current_index: 1 }, error: null });
    const out = await submitAnswer('b1', 'host', 0, 2, 0);
    expect(out).toEqual({ id: 'b1', current_index: 1 });
    expect(rpc).toHaveBeenCalledWith('tickra_battle_answer', {
      p_id: 'b1',
      p_side: 'host',
      p_index: 0,
      p_answer: 2,
    });
    expect(single).not.toHaveBeenCalled();
  });

  it('falls back only when the function does not exist yet', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'not found' } });
    single.mockResolvedValue({ data: null, error: null }); // legacy getBattle → not found
    expect(await submitAnswer('b1', 'host', 0, 2, 1000)).toBeNull();
    expect(single).toHaveBeenCalled();
  });

  it('does not fall back on any other error', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: '40001', message: 'serialization failure' } });
    expect(await submitAnswer('b1', 'host', 0, 2, 0)).toBeNull();
    expect(single).not.toHaveBeenCalled();
  });
});
