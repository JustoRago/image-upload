/* eslint-disable testing-library/no-unnecessary-act */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '../redux/configureStore';
import { act } from 'react';
import App from '../App';

describe('tests navbar states', () => {
  beforeEach(() => {
    fetch.resetMocks()
  })

  it('renders navbar logged out', async () => {
    fetch.mockResponses(
      [
        JSON.stringify({
          valid: false,
          user: null
        })
      ],
      [
        JSON.stringify({
          status: "success",
          body: [{filepath: '#'}]
        })
      ]
    )
    await act(() => {
      render(
        <Provider store={store}>
          <App />
        </Provider>
      );
    })
    const navBarLogo = screen.getByText(/Image Store/i)
    const loginButton = screen.getByText(/Log In/i)
    const signupButton = screen.getByText(/Sign Up/i)
    const addImage = screen.queryByText(/Add Image/i)
    const addCategory = screen.queryByText(/Add Category/i)
    
    expect(navBarLogo).toBeInTheDocument();
    expect(loginButton).toBeInTheDocument();
    expect(signupButton).toBeInTheDocument();
    expect(addImage).toBeNull();
    expect(addCategory).toBeNull();
  })

  it('renders navbar logged in', async () => {
    fetch.mockResponses(
      [
        JSON.stringify({
          user: { username: "test"}
        })
      ],
      [
        JSON.stringify({
          status: "success",
          body: [{filepath: '#'}]
        })
      ]
    )
    await act(() => {
      render(
        <Provider store={store}>  
          <App />
        </Provider>
      );
    })
    const navBarUser = screen.getByText(/test/i)
    const addImage = screen.getByText(/Add Image/i)
    const addCategory = screen.getByText(/Add Category/i)
    const loginButton = screen.queryByText(/Log In/i)
    const signupButton = screen.queryByText(/Sign Up/i)
    expect(navBarUser).toBeInTheDocument();
    expect(addImage).toBeInTheDocument();
    expect(addCategory).toBeInTheDocument();
    expect(loginButton).toBeNull();
    expect(signupButton).toBeNull();
  })
});