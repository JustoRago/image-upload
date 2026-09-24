import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiFetch } from "../../api";

const createRegistration = createAsyncThunk('registration/createRegistration', async (obj, { rejectWithValue }) => {
  try {
    return await apiFetch('/api/v1/users/signup', { method: 'POST', body: obj });
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
})

const registrationSlice = createSlice({
  name: 'registration',
  initialState: {
    user: null,
    loading: false,
    error: null
  },
  extraReducers: (builder) => {
    builder.addCase(createRegistration.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(createRegistration.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      user: action.payload.user,
    }));
    builder.addCase(createRegistration.rejected, (state, action) => ({
      ...state,
      loading: false,
      user: null,
      error: action.payload?.message || action.error.message,
    }));
  }
})

export { createRegistration };
export default registrationSlice.reducer;