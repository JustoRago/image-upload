/* eslint-disable testing-library/no-unnecessary-act */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { act } from 'react';
import Category from '../pages/Category';
import { checkSession } from '../redux/session/sessionSlice';
import sessionReducer from '../redux/session/sessionSlice';
import categoriesReducer from '../redux/categories/categorySlice';
import imagesReducer from '../redux/images/imagesSlice';

const makeStore = () => configureStore({
  reducer: { sessionReducer, categoriesReducer, imagesReducer },
});

const CATEGORY = {
  id: 7,
  categoryname: 'Nature',
  description: 'First paragraph.\n\nSecond paragraph.',
  private: false,
  creator_id: 1,
};

const renderPage = (store) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={['/category/7']}>
      <Routes>
        <Route path="/category/:categoryId" element={<Category />} />
      </Routes>
    </MemoryRouter>
  </Provider>
);

describe('Category page descriptions', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('shows the category description with line breaks preserved', async () => {
    fetch.mockResponseOnce(JSON.stringify({ status: 'success', data: { category: [CATEGORY] } }));
    fetch.mockResponseOnce(JSON.stringify({ status: 'success', body: [] }));
    await act(async () => {
      render(renderPage(makeStore()));
    });
    expect(screen.getByText(/First paragraph\./)).toBeInTheDocument();
    expect(screen.getByText(/Second paragraph\./)).toBeInTheDocument();
  });

  it('lets the owner edit the description and shows the updated text', async () => {
    const store = makeStore();
    // Log the user in first so the page treats them as the owner.
    fetch.mockResponseOnce(JSON.stringify({ user: { id: 1 } }));
    await act(async () => {
      await store.dispatch(checkSession());
    });

    fetch.mockResponseOnce(JSON.stringify({ status: 'success', data: { category: [CATEGORY] } }));
    fetch.mockResponseOnce(JSON.stringify({ status: 'success', body: [] }));
    await act(async () => {
      render(renderPage(store));
    });

    fireEvent.click(screen.getByRole('button', { name: /edit description/i }));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Brand new description' } });

    fetch.mockResponseOnce(JSON.stringify({
      status: 'success',
      message: 'Category updated',
      data: { id: 7, name: 'Nature', private: false, description: 'Brand new description' },
    }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save description/i }));
    });

    expect(screen.getByText('Brand new description')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('does not offer description editing to anonymous visitors', async () => {
    fetch.mockResponseOnce(JSON.stringify({ status: 'success', data: { category: [CATEGORY] } }));
    fetch.mockResponseOnce(JSON.stringify({ status: 'success', body: [] }));
    await act(async () => {
      render(renderPage(makeStore()));
    });
    expect(screen.queryByRole('button', { name: /edit description/i })).toBeNull();
  });
});