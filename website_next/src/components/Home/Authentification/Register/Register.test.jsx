import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Register from './';

// Mock de fetch
global.fetch = jest.fn();

describe('Register Component', () => {
    beforeEach(() => {
        fetch.mockClear();
        jest.clearAllMocks();
    });

    it('renders registration form with all required fields', () => {
        render(<Register />);

        // Vérification de la présence de tous les champs
        expect(screen.getByPlaceholderText('Nom')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Prénom')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Âge')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Société')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Mot de passe')).toBeInTheDocument();
        expect(screen.getByText("S'inscrire")).toBeInTheDocument();
    });

    it('handles registration error from API', async () => {
        const errorMessage = 'Email déjà utilisé';
        fetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: false,
                json: () => Promise.resolve({ message: errorMessage })
            })
        );

        render(<Register />);

        const fields = {
            name: screen.getByPlaceholderText('Nom'),
            surname: screen.getByPlaceholderText('Prénom'),
            age: screen.getByPlaceholderText('Âge'),
            society: screen.getByPlaceholderText('Société'),
            email: screen.getByPlaceholderText('Email'),
            password: screen.getByPlaceholderText('Mot de passe')
        };

        await act(async () => {
            await userEvent.type(fields.name, 'John');
            await userEvent.type(fields.surname, 'Doe');
            await userEvent.type(fields.age, '25');
            await userEvent.type(fields.society, 'Tech Corp');
            await userEvent.type(fields.email, 'john@example.com');
            await userEvent.type(fields.password, 'password123');

            fireEvent.click(screen.getByText("S'inscrire"));
        });

        await waitFor(() => {
            expect(screen.getByText(`Erreur : ${errorMessage}`)).toBeInTheDocument();
        });
    });

    it('handles network error during registration', async () => {
        fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

        render(<Register />);

        const fields = {
            name: screen.getByPlaceholderText('Nom'),
            surname: screen.getByPlaceholderText('Prénom'),
            age: screen.getByPlaceholderText('Âge'),
            society: screen.getByPlaceholderText('Société'),
            email: screen.getByPlaceholderText('Email'),
            password: screen.getByPlaceholderText('Mot de passe')
        };

        await act(async () => {
            await userEvent.type(fields.name, 'John');
            await userEvent.type(fields.surname, 'Doe');
            await userEvent.type(fields.age, '25');
            await userEvent.type(fields.society, 'Tech Corp');
            await userEvent.type(fields.email, 'john@example.com');
            await userEvent.type(fields.password, 'password123');

            fireEvent.click(screen.getByText("S'inscrire"));
        });

        await waitFor(() => {
            expect(screen.getByText("Erreur lors de l'inscription. Veuillez réessayer.")).toBeInTheDocument();
        });
    });

    it('validates required fields before submission', async () => {
        render(<Register />);

        await act(async () => {
            fireEvent.click(screen.getByText("S'inscrire"));
        });

        // Vérifie que fetch n'a pas été appelé si les champs requis ne sont pas remplis
        expect(fetch).not.toHaveBeenCalled();
    });
});