/* eslint-disable testing-library/no-unnecessary-act */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { act } from 'react';
import RequireAuth from '../components/RequireAuth';
import sessionReducer from '../redux/session/sessionSlice';

// A fresh store per test so session state never leaks between cases.
const makeStore = () => configureStore({ reducer: { sessionReducer } });

const Harness = ({ store }) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={<RequireAuth><div>Secret page</div></RequireAuth>}
        />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>
  </Provider>
);

describe('RequireAuth', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });

  it('renders its children for a logged-in user', async () => {
    fetch.mockResponseOnce(JSON.stringify({ user: { id: 1, username: 'alice' } }));
    await act(async () => {
      render(<Harness store={makeStore()} />);
    });
    expect(screen.getByText('Secret page')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).toBeNull();
  });

  it('redirects anonymous users to /login without flashing the content', async () => {
    fetch.mockResponseOnce(JSON.stringify({ valid: false, user: null }));
    await act(async () => {
      render(<Harness store={makeStore()} />);
    });
    await act(async () => {
      // Flush the navigation effect triggered by the session check.
    });
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret page')).toBeNull();
  });
});