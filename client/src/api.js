import { BASE_URL } from './constants';

// Thrown by apiFetch for any non-2xx response. Carries the parsed body so
// thunks can hand it straight to rejectWithValue and components keep reading
// the same { status, message, errors } shapes they always have.
export class ApiError extends Error {
  constructor(status, body) {
    super((body && typeof body === 'object' && body.message) || `Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

// The single fetch wrapper used by every async thunk. It injects the session
// cookie, sets the JSON content type for object bodies (but never for
// FormData), parses the response, and throws an ApiError when the request is
// anything other than 2xx — so error handling stays consistent everywhere.
export async function apiFetch(path, { method = 'GET', body, headers } = {}) {
  const jsonBody = body != null && typeof body !== 'string' && !(body instanceof FormData);

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        ...(jsonBody ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      credentials: 'include',
      body: jsonBody ? JSON.stringify(body) : body,
    });
  } catch (err) {
    throw new ApiError(0, { message: `Network error: ${err.message}` });
  }

  const text = await response.text();
  let parsed = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) throw new ApiError(response.status, parsed);
  return parsed;
}