/* eslint-disable testing-library/no-unnecessary-act */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { act } from 'react';
import AddCategory from '../pages/AddCategory';
import categoriesReducer from '../redux/categories/categorySlice';

const makeStore = () => configureStore({ reducer: { categoriesReducer } });

const renderPage = (store) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={['/add_category']}>
      <Routes>
        <Route path="/add_category" element={<AddCategory />} />
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>
  </Provider>
);

describe('AddCategory', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('sends the optional description with the new category and navigates on success', async () => {
    fetch.mockResponseOnce(JSON.stringify({
      status: 'success',
      message: 'Category created',
      data: { id: 1, name: 'Nature', private: false, description: 'Desc text' },
    }));
    await act(async () => {
      render(renderPage(makeStore()));
    });

    fireEvent.change(screen.getByPlaceholderText(/category/i), { target: { value: 'Nature' } });
    fireEvent.change(screen.getByPlaceholderText(/description/i), { target: { value: 'Desc text' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit category/i }));
    });

    const [url, opts] = fetch.mock.calls[0];
    expect(url).toContain('/api/v1/categories');
    expect(JSON.parse(opts.body)).toEqual({ category: 'Nature', privacy: false, description: 'Desc text' });
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('shows the validation error inline and stays on the page', async () => {
    fetch.mockResponseOnce(JSON.stringify({ errors: [{ msg: 'Category name is required' }] }), { status: 422 });
    await act(async () => {
      render(renderPage(makeStore()));
    });

    fireEvent.change(screen.getByPlaceholderText(/category/i), { target: { value: 'Nature' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit category/i }));
    });

    expect(screen.getByText('Category name is required')).toBeInTheDocument();
    expect(screen.queryByText('Home page')).toBeNull();
  });
});