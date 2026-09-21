import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { BASE_URL } from '../../constants';

const searchImages = createAsyncThunk('images/searchImages', async (obj) => {
  const resp = await fetch(`${BASE_URL}/api/v1/images?search=${encodeURIComponent(obj)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
  })
    .then((resp) => resp.json());
  return resp;
})

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    loading: false,
    images: []
  },
  extraReducers: (builder) => {
    builder.addCase(searchImages.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(searchImages.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      image: action.payload.body,
    }));
    builder.addCase(searchImages.rejected, (state, action) => ({
      ...state,
      loading: false,
      images: [],
      error: action.error.message,
    }));
  },
});

export default searchSlice.reducer;
export { searchImages };