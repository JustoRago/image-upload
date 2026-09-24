import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../../api';

const createSession = createAsyncThunk('session/createSession', async (obj, { rejectWithValue }) => {
  try {
    return await apiFetch('/api/v1/users/login', { method: 'POST', body: obj });
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

const destroySession = createAsyncThunk('session/destroySession', async () => {
  await apiFetch('/api/v1/users/logout', { method: 'DELETE' });
  return null;
});

const checkSession = createAsyncThunk('session/checkSession', async () => {
  return await apiFetch('/api/v1/users');
});

const updatePassword = createAsyncThunk('session/updatePassword', async (obj, { rejectWithValue }) => {
  try {
    return await apiFetch('/api/v1/users/password', { method: 'PATCH', body: obj });
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

const deleteAccount = createAsyncThunk('session/deleteAccount', async (_, { rejectWithValue }) => {
  try {
    return await apiFetch('/api/v1/users/account', { method: 'DELETE' });
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

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
      error: action.payload?.message || action.error.message,
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
      error: action.payload?.message || action.error.message,
    }));
    builder.addCase(deleteAccount.fulfilled, (state) => ({
      ...state,
      loading: false,
      user: null,
    }));
  }
});

export { checkSession, createSession, destroySession, updatePassword, deleteAccount };
export default sessionSlice.reducer;