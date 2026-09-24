import { apiFetch, ApiError } from '../api';

describe('apiFetch', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('GETs and returns the parsed JSON body', async () => {
    fetch.mockResponseOnce(JSON.stringify({ ok: true }));
    const body = await apiFetch('/api/v1/users');
    expect(body).toEqual({ ok: true });
  });

  it('throws an ApiError carrying the parsed body for non-2xx responses', async () => {
    fetch.mockResponseOnce(JSON.stringify({ status: 'failed', message: 'Nope' }), { status: 400 });
    await expect(apiFetch('/api/v1/users/login')).rejects.toMatchObject({
      status: 400,
      body: { status: 'failed', message: 'Nope' },
    });
  });

  it('sends object bodies as JSON with the content-type header and credentials', async () => {
    fetch.mockResponseOnce(JSON.stringify({ ok: true }));
    await apiFetch('/api/v1/users/login', { method: 'POST', body: { username: 'alice' } });
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/api/v1/users/login');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(opts.credentials).toBe('include');
    expect(JSON.parse(opts.body)).toEqual({ username: 'alice' });
  });

  it('does not force a JSON content type on FormData bodies', async () => {
    fetch.mockResponseOnce(JSON.stringify({ ok: true }));
    const fd = new FormData();
    fd.append('a', 'b');
    await apiFetch('/api/v1/images', { method: 'POST', body: fd });
    const [, opts] = fetch.mock.calls[0];
    expect(opts.headers['Content-Type']).toBeUndefined();
  });
});

describe('ApiError', () => {
  it('uses the body message when present', () => {
    const err = new ApiError(401, { message: 'Not logged in' });
    expect(err.message).toBe('Not logged in');
    expect(err.status).toBe(401);
  });

  it('falls back to a generic message otherwise', () => {
    const err = new ApiError(500, null);
    expect(err.message).toBe('Request failed (500)');
  });
});