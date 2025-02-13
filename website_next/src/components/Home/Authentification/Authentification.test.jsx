import React from 'react';
import { render, screen } from '@testing-library/react';
import Authentification from './';

// Mock des composants enfants
jest.mock('@/components/Home/Authentification/Login/index', () => {
    return function MockLogin() {
        return <div data-testid="login-component">Login Component</div>;
    };
});

jest.mock('@/components/Home/Authentification/Register/index', () => {
    return function MockRegister() {
        return <div data-testid="register-component">Register Component</div>;
    };
});

describe('Authentification Component', () => {
    it('renders both Login and Register components', () => {
        render(<Authentification />);

        expect(screen.getByTestId('login-component')).toBeInTheDocument();
        expect(screen.getByTestId('register-component')).toBeInTheDocument();
    });

    it('renders components in correct order', () => {
        render(<Authentification />);

        const components = screen.getAllByTestId(/-component$/);
        expect(components[0]).toHaveTextContent('Register Component');
        expect(components[1]).toHaveTextContent('Login Component');
    });

    it('maintains proper component structure', () => {
        const { container } = render(<Authentification />);

        // Vérifie que les composants sont dans un conteneur div
        expect(container.firstChild.tagName).toBe('DIV');
        expect(container.firstChild.children.length).toBe(2);
    });
});