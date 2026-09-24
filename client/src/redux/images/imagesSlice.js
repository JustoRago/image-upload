import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../../api';

const getImages = createAsyncThunk('images/getImage', async (params, { rejectWithValue }) => {
  try {
    return await apiFetch(`/api/v1/images?${params}`);
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

const getImagesPerCategory = createAsyncThunk('images/getImagesPerCategory', async (cat, { rejectWithValue }) => {
  try {
    return await apiFetch(`/api/v1/images/${cat}`);
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

const addImage = createAsyncThunk('images/addImage', async (obj, { rejectWithValue }) => {
  try {
    return await apiFetch('/api/v1/images', { method: 'POST', body: obj });
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

const updateImage = createAsyncThunk('images/updateImage', async ({ id, img_name }, { rejectWithValue }) => {
  try {
    return await apiFetch(`/api/v1/images/${id}`, { method: 'PATCH', body: { img_name } });
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

const deleteImage = createAsyncThunk('images/deleteImage', async (id, { rejectWithValue }) => {
  try {
    return await apiFetch(`/api/v1/images/${id}`, { method: 'DELETE' });
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

const imagesSlice = createSlice({
  name: 'images',
  initialState: {
    loading: false,
    images: [],
    error: null,
  },
  extraReducers: (builder) => {
    builder.addCase(getImages.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(getImages.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      images: action.payload?.body ?? [],
    }));
    builder.addCase(getImages.rejected, (state, action) => ({
      ...state,
      loading: false,
      images: [],
      error: action.payload?.message || action.error.message,
    }));
    builder.addCase(getImagesPerCategory.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(getImagesPerCategory.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      images: action.payload?.body ?? [],
    }));
    builder.addCase(getImagesPerCategory.rejected, (state, action) => ({
      ...state,
      loading: false,
      images: [],
      error: action.payload?.message || action.error.message,
    }));
    builder.addCase(addImage.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(addImage.fulfilled, (state) => ({
      ...state,
      loading: false,
    }));
    builder.addCase(addImage.rejected, (state, action) => ({
      ...state,
      loading: false,
      error: action.payload?.message || action.error.message,
    }));
    builder.addCase(updateImage.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(updateImage.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      images: state.images.map((img) =>
        img.id === action.meta.arg.id
          ? { ...img, ...(action.payload?.body?.[0] || {}) }
          : img
      ),
    }));
    builder.addCase(updateImage.rejected, (state, action) => ({
      ...state,
      loading: false,
      error: action.payload?.message || action.error.message,
    }));
    builder.addCase(deleteImage.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(deleteImage.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      images: state.images.filter((img) => img.id !== action.meta.arg),
    }));
    builder.addCase(deleteImage.rejected, (state, action) => ({
      ...state,
      loading: false,
      error: action.payload?.message || action.error.message,
    }));
  },
});

export default imagesSlice.reducer;
export { addImage, getImages, getImagesPerCategory, updateImage, deleteImage };