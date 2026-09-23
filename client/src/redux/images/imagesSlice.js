import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { BASE_URL } from '../../constants';

const getImages = createAsyncThunk('images/getImage', async (params) => {
  const resp = await fetch(`${BASE_URL}/api/v1/images?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
  })
    .then((resp) => resp.json())
  return resp;
});

const getImagesPerCategory = createAsyncThunk('images/getImagesPerCategory', async (cat) => {
  const resp = await fetch(`${BASE_URL}/api/v1/images/${cat}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
  })
    .then((resp) => resp.json());
  return resp;
})

const addImage = createAsyncThunk('images/addImage', async (obj) => {
  const response = await fetch(`${BASE_URL}/api/v1/images`, {
    method: 'POST',
    credentials: "include",
    body: obj,
  })
    .then((response) => response.json())
  return response;
});

const updateImage = createAsyncThunk('images/updateImage', async ({ id, img_name }) => {
  const response = await fetch(`${BASE_URL}/api/v1/images/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
    body: JSON.stringify({ img_name }),
  })
    .then((response) => response.json())
  return response;
});

const deleteImage = createAsyncThunk('images/deleteImage', async (id) => {
  const response = await fetch(`${BASE_URL}/api/v1/images/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: "include",
  })
    .then((response) => response.json())
  return response;
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
      image: action.payload,
    }));
    builder.addCase(getImages.rejected, (state, action) => ({
      ...state,
      loading: false,
      images: [],
      error: action.error.message,
    }));
    builder.addCase(getImagesPerCategory.pending, (state) => ({
      ...state,
      loading: true,
    }));
    builder.addCase(getImagesPerCategory.fulfilled, (state, action) => ({
      ...state,
      loading: false,
      image: action.payload,
    }));
    builder.addCase(getImagesPerCategory.rejected, (state, action) => ({
      ...state,
      loading: false,
      images: [],
      error: action.error.message,
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
      error: action.error.message,
    }));
  },
});

export default imagesSlice.reducer;
export { addImage, getImages, getImagesPerCategory, updateImage, deleteImage };