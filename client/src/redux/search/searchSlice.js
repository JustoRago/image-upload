import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../../api';

const searchImages = createAsyncThunk('images/searchImages', async (query, { rejectWithValue }) => {
  try {
    return await apiFetch(`/api/v1/images?search=${encodeURIComponent(query)}`);
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    loading: false,
    images: [],
    error: null,
  },
  extraReducers: (builder) => {
    builder.addCase(searchImages.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(searchImages.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      images: action.payload?.body ?? [],
    }));
    builder.addCase(searchImages.rejected, (state, action) => ({
      ...state,
      loading: false,
      images: [],
      error: action.payload?.message || action.error.message,
    }));
  },
});

export default searchSlice.reducer;
export { searchImages };