import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { BASE_URL } from '../../constants';

const getCategories = createAsyncThunk('categories/getCategory', async () => {
  const resp = await fetch(`${BASE_URL}/api/v1/categories`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
  })
    .then((resp) => resp.json())
  return resp;
});

const getCategoryById = createAsyncThunk('categories/getCategoryById', async (id) => {
  const resp = await fetch(`${BASE_URL}/api/v1/categories/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
  })
    .then((resp) => resp.json())
  return resp;
})

const addCategory = createAsyncThunk('categories/addCategory', async (obj) => {
  const response = await fetch(`${BASE_URL}/api/v1/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify(obj),
  });
  return response.json();
});

const updateCategory = createAsyncThunk('categories/updateCategory', async ({ id, category, privacy }) => {
  const response = await fetch(`${BASE_URL}/api/v1/categories/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify({ category, privacy }),
  });
  return response.json();
});

const deleteCategory = createAsyncThunk('categories/deleteCategory', async (id) => {
  const response = await fetch(`${BASE_URL}/api/v1/categories/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
  });
  return response.json();
});

const categorySlice = createSlice({
  name: 'categories',
  initialState: {
    loading: false,
    categories: [],
    currentCategory: {},
  },
  extraReducers: (builder) => {
    builder.addCase(getCategories.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(getCategories.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      categories: action.payload,
    }));
    builder.addCase(getCategories.rejected, (state, action) => ({
      ...state,
      loading: false,
      categories: [],
      error: action.error.message,
    }));
    builder.addCase(getCategoryById.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(getCategoryById.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      currentCategory: action.payload,
    }));
    builder.addCase(getCategoryById.rejected, (state, action) => ({
      ...state,
      loading: false,
      currentCategory: {},
      error: action.error.message,
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
      error: action.error.message,
    }));
  },
});

export default categorySlice.reducer;
export { getCategories, getCategoryById, addCategory, updateCategory, deleteCategory };