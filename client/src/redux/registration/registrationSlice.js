import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { BASE_URL } from "../../constants";

const createRegistration = createAsyncThunk('registration/createRegistration', async (obj, { rejectWithValue }) => {
  const response = await fetch(`${BASE_URL}/api/v1/users/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(obj),
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Signup failed' }));
    return rejectWithValue(error);
  }
  return response.json();
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
      error: action.error.message,
    }));
  }
})

export { createRegistration };
export default registrationSlice.reducer;