import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../../api';

const getCategories = createAsyncThunk('categories/getCategory', async (_, { rejectWithValue }) => {
  try {
    return await apiFetch('/api/v1/categories');
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

const getCategoryById = createAsyncThunk('categories/getCategoryById', async (id, { rejectWithValue }) => {
  try {
    return await apiFetch(`/api/v1/categories/${id}`);
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

const addCategory = createAsyncThunk('categories/addCategory', async (obj, { rejectWithValue }) => {
  try {
    return await apiFetch('/api/v1/categories', { method: 'POST', body: obj });
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

const updateCategory = createAsyncThunk('categories/updateCategory', async ({ id, category, privacy }, { rejectWithValue }) => {
  try {
    return await apiFetch(`/api/v1/categories/${id}`, { method: 'PATCH', body: { category, privacy } });
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

const deleteCategory = createAsyncThunk('categories/deleteCategory', async (id, { rejectWithValue }) => {
  try {
    return await apiFetch(`/api/v1/categories/${id}`, { method: 'DELETE' });
  } catch (err) {
    return rejectWithValue(err.body || { message: err.message });
  }
});

const categorySlice = createSlice({
  name: 'categories',
  initialState: {
    loading: false,
    categories: [],
    currentCategory: null,
    error: null,
  },
  extraReducers: (builder) => {
    builder.addCase(getCategories.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(getCategories.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      categories: action.payload?.data?.categories ?? [],
    }));
    builder.addCase(getCategories.rejected, (state, action) => ({
      ...state,
      loading: false,
      categories: [],
      error: action.payload?.message || action.error.message,
    }));
    builder.addCase(getCategoryById.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(getCategoryById.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      currentCategory: action.payload?.data?.category?.[0] ?? null,
    }));
    builder.addCase(getCategoryById.rejected, (state, action) => ({
      ...state,
      loading: false,
      currentCategory: null,
      error: action.payload?.message || action.error.message,
    }));
    builder.addCase(addCategory.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(addCategory.fulfilled, (state) => ({
      ...state,
      loading: false,
    }));
    builder.addCase(addCategory.rejected, (state, action) => ({
      ...state,
      loading: false,
      error: action.payload?.message || action.error.message,
    }));
    builder.addCase(updateCategory.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(updateCategory.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      categories: state.categories.map((c) =>
        c.id === action.meta.arg.id
          ? {
              ...c,
              categoryname: action.payload?.data?.name ?? c.categoryname,
              private: action.payload?.data?.private ?? c.private,
            }
          : c
      ),
      currentCategory:
        state.currentCategory?.id === action.meta.arg.id
          ? { ...state.currentCategory, ...action.payload?.data }
          : state.currentCategory,
    }));
    builder.addCase(updateCategory.rejected, (state, action) => ({
      ...state,
      loading: false,
      error: action.payload?.message || action.error.message,
    }));
    builder.addCase(deleteCategory.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(deleteCategory.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      categories: state.categories.filter((c) => c.id !== action.meta.arg),
      currentCategory:
        state.currentCategory?.id === action.meta.arg ? null : state.currentCategory,
    }));
    builder.addCase(deleteCategory.rejected, (state, action) => ({
      ...state,
      loading: false,
      error: action.payload?.message || action.error.message,
    }));
  },
});

export default categorySlice.reducer;
export { getCategories, getCategoryById, addCategory, updateCategory, deleteCategory };