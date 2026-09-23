import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { BASE_URL } from '../../constants';

const createSession = createAsyncThunk('session/createSession', async (obj, { rejectWithValue }) => {
  const response = await fetch(`${BASE_URL}/api/v1/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(obj),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    return rejectWithValue(error);
  }
  return response.json();
})

const destroySession = createAsyncThunk('session/destroySession', async () => {
  await fetch(`${BASE_URL}/api/v1/users/logout`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  return null
})

const checkSession = createAsyncThunk('session/checkSession', async () => {
  const response = await fetch(`${BASE_URL}/api/v1/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error(`Session check failed: ${response.status}`);
  }
  return response.json();
})

const updatePassword = createAsyncThunk('session/updatePassword', async (obj, { rejectWithValue }) => {
  const response = await fetch(`${BASE_URL}/api/v1/users/password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(obj),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Could not update password' }));
    return rejectWithValue(error);
  }
  return response.json();
})

const deleteAccount = createAsyncThunk('session/deleteAccount', async (_, { rejectWithValue }) => {
  const response = await fetch(`${BASE_URL}/api/v1/users/account`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Could not delete account' }));
    return rejectWithValue(error);
  }
  return response.json();
})

const sessionSlice = createSlice({
  name: 'session',
  initialState: {
    user: null,
    loading: false,
    error: null
  },
  extraReducers: (builder) => {
    builder.addCase(checkSession.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(checkSession.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      user: action.payload.user,
    }));
    builder.addCase(checkSession.rejected, (state, action) => ({
      ...state,
      loading: false,
      user: null,
      error: action.error.message,
    }));
    builder.addCase(createSession.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(createSession.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      user: action.payload.user,
    }));
    builder.addCase(createSession.rejected, (state, action) => ({
      ...state,
      loading: false,
      user: null,
      error: action.error.message,
    }));
    builder.addCase(destroySession.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(destroySession.fulfilled, (state) => ({
      ...state,
      loading: false,
      user: null,
    }));
    builder.addCase(destroySession.rejected, (state, action) => ({
      ...state,
      loading: false,
      user: null,
      error: action.error.message,
    }));
    builder.addCase(deleteAccount.fulfilled, (state) => ({
      ...state,
      loading: false,
      user: null,
    }));
  }
})

export { checkSession, createSession, destroySession, updatePassword, deleteAccount };
export default sessionSlice.reducer;