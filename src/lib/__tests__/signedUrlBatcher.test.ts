import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client BEFORE importing the batcher.
const createSignedUrls = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: () => ({
        createSignedUrls: (...args: unknown[]) => createSignedUrls(...args),
      }),
    },
  },
}));

import { getSignedUrlsBatched, SIGNED_URL_TTL_SECONDS } from '@/lib/signedUrlBatcher';

describe('signedUrlBatcher', () => {
  beforeEach(() => {
    createSignedUrls.mockReset();
  });

  it('coalesces concurrent callers into a single storage request', async () => {
    createSignedUrls.mockResolvedValueOnce({
      data: [
        { path: 'a/1.jpg', signedUrl: 'https://signed/a1' },
        { path: 'b/2.jpg', signedUrl: 'https://signed/b2' },
        { path: 'b/3.jpg', signedUrl: 'https://signed/b3' },
      ],
      error: null,
    });

    const [r1, r2] = await Promise.all([
      getSignedUrlsBatched(['a/1.jpg']),
      getSignedUrlsBatched(['b/2.jpg', 'b/3.jpg']),
    ]);

    expect(createSignedUrls).toHaveBeenCalledTimes(1);
    expect(createSignedUrls.mock.calls[0][0]).toEqual(['a/1.jpg', 'b/2.jpg', 'b/3.jpg']);
    expect(createSignedUrls.mock.calls[0][1]).toBe(SIGNED_URL_TTL_SECONDS);
    // Each caller gets back exactly its own URLs, in its own order.
    expect(r1).toEqual(['https://signed/a1']);
    expect(r2).toEqual(['https://signed/b2', 'https://signed/b3']);
  });

  it('dedupes paths shared across callers within a batch', async () => {
    createSignedUrls.mockResolvedValueOnce({
      data: [{ path: 'shared/x.jpg', signedUrl: 'https://signed/x' }],
      error: null,
    });

    const [r1, r2] = await Promise.all([
      getSignedUrlsBatched(['shared/x.jpg']),
      getSignedUrlsBatched(['shared/x.jpg']),
    ]);

    expect(createSignedUrls).toHaveBeenCalledTimes(1);
    expect(createSignedUrls.mock.calls[0][0]).toEqual(['shared/x.jpg']);
    expect(r1).toEqual(['https://signed/x']);
    expect(r2).toEqual(['https://signed/x']);
  });

  it('issues separate requests for callers in different batch windows', async () => {
    createSignedUrls
      .mockResolvedValueOnce({
        data: [{ path: 'a/1.jpg', signedUrl: 'https://signed/a1' }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ path: 'b/2.jpg', signedUrl: 'https://signed/b2' }],
        error: null,
      });

    const r1 = await getSignedUrlsBatched(['a/1.jpg']);
    const r2 = await getSignedUrlsBatched(['b/2.jpg']);

    expect(createSignedUrls).toHaveBeenCalledTimes(2);
    expect(r1).toEqual(['https://signed/a1']);
    expect(r2).toEqual(['https://signed/b2']);
  });

  it('drops paths the API failed to sign instead of returning holes', async () => {
    createSignedUrls.mockResolvedValueOnce({
      data: [
        { path: 'a/ok.jpg', signedUrl: 'https://signed/ok' },
        { path: 'a/missing.jpg', signedUrl: null, error: 'Object not found' },
      ],
      error: null,
    });

    const result = await getSignedUrlsBatched(['a/ok.jpg', 'a/missing.jpg']);
    expect(result).toEqual(['https://signed/ok']);
  });

  it('rejects every caller in the batch when the storage call fails', async () => {
    createSignedUrls.mockResolvedValueOnce({ data: null, error: new Error('boom') });

    const p1 = getSignedUrlsBatched(['a/1.jpg']);
    const p2 = getSignedUrlsBatched(['b/2.jpg']);

    await expect(p1).rejects.toThrow('boom');
    await expect(p2).rejects.toThrow('boom');
    expect(createSignedUrls).toHaveBeenCalledTimes(1);
  });
});
