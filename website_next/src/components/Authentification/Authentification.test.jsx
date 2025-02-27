/* eslint-disable prettier/prettier */
// Authentification.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import Authentification from './Authentification';

jest.mock('@/components/Authentification/Login/', () => () => <div data-testid="login-component">Login Component</div>);
jest.mock('@/components/Authentification/Register/', () => () => <div data-testid="register-component">Register Component</div>);

describe('Authentification Component', () => {
  test('affiche bien les composants Register et Login', () => {
    render(<Authentification />);

    // Vérification que les deux composants sont présents dans le DOM
    const register = screen.getByTestId('register-component');
    const login = screen.getByTestId('login-component');

    expect(register).toBeInTheDocument();
    expect(login).toBeInTheDocument();
  });
});
