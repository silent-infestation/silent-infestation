import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './';

// Mock des modules Next.js
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn()
    })
}));

// Mock de fetch
global.fetch = jest.fn();

describe('Login Component', () => {
    beforeEach(() => {
        // Réinitialisation des mocks avant chaque test
        fetch.mockClear();
        jest.clearAllMocks();
    });

    it('renders login form with all fields', () => {
        render(<Login />);

        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Mot de passe')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirmer le mot de passe')).toBeInTheDocument();
        expect(screen.getByText('Se connecter')).toBeInTheDocument();
        expect(screen.getByText('Se connecter avec Google')).toBeInTheDocument();
    });

    it('updates form values when typing', async () => {
        render(<Login />);

        const emailInput = screen.getByPlaceholderText('Email');
        const passwordInput = screen.getByPlaceholderText('Mot de passe');
        const confirmPasswordInput = screen.getByPlaceholderText('Confirmer le mot de passe');

        await act(async () => {
            await userEvent.type(emailInput, 'test@example.com');
            await userEvent.type(passwordInput, 'password123');
            await userEvent.type(confirmPasswordInput, 'password123');
        });

        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('password123');
        expect(confirmPasswordInput.value).toBe('password123');
    });

    it('shows error message when passwords do not match', async () => {
        render(<Login />);

        const emailInput = screen.getByPlaceholderText('Email');
        const passwordInput = screen.getByPlaceholderText('Mot de passe');
        const confirmPasswordInput = screen.getByPlaceholderText('Confirmer le mot de passe');
        const submitButton = screen.getByText('Se connecter');

        await act(async () => {
            await userEvent.type(emailInput, 'test@example.com');
            await userEvent.type(passwordInput, 'password123');
            await userEvent.type(confirmPasswordInput, 'different');
            await userEvent.click(submitButton);
        });

        expect(screen.getByText('Les mots de passe ne correspondent pas.')).toBeInTheDocument();
    });

    it('displays error message on failed login', async () => {
        const errorMessage = 'Invalid credentials';
        fetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ message: errorMessage })
            })
        );

        render(<Login />);

        const emailInput = screen.getByPlaceholderText('Email');
        const passwordInput = screen.getByPlaceholderText('Mot de passe');
        const confirmPasswordInput = screen.getByPlaceholderText('Confirmer le mot de passe');
        const submitButton = screen.getByText('Se connecter');

        await act(async () => {
            await userEvent.type(emailInput, 'test@example.com');
            await userEvent.type(passwordInput, 'password123');
            await userEvent.type(confirmPasswordInput, 'password123');
            await userEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });
});