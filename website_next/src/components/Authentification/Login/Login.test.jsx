import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '.';
import { useAppContext } from '@/app/context/AppContext';

jest.mock('@/app/context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

global.fetch = jest.fn();

describe('Login Component', () => {
  let user;
  let loginMock;

  beforeEach(() => {
    fetch.mockClear();
    jest.clearAllMocks();
    user = userEvent.setup();
    loginMock = jest.fn();
    useAppContext.mockReturnValue({ login: loginMock });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('renders login form with all fields', () => {
    render(<Login />);

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByText('Se connecter')).toBeInTheDocument();
    expect(screen.getByText('Se connecter avec Google')).toBeInTheDocument();
  });

  it('updates form values when typing', async () => {
    render(<Login />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Mot de passe');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('displays error message on failed login', async () => {
    const errorMessage = 'Erreur lors de la connexion';
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: errorMessage }),
      })
    );

    render(<Login />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Mot de passe');
    const submitButton = screen.getByText('Se connecter');

    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Erreur lors de la connexion')).toBeInTheDocument();
    });
  });

  it('calls login function on successful login', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    render(<Login />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Mot de passe');
    const submitButton = screen.getByText('Se connecter');

    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/auth/login', expect.any(Object));
      expect(loginMock).toHaveBeenCalled();
    });
  });

  it('handles network error gracefully', async () => {
    fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    render(<Login />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Mot de passe');
    const submitButton = screen.getByText('Se connecter');

    await act(async () => {
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Impossible de contacter le serveur.')).toBeInTheDocument();
    });
  });
});
