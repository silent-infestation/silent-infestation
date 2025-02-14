import React from 'react';
import { render, screen } from '@testing-library/react';
import Team from './';

// Mock de AOS
jest.mock('aos', () => ({
    init: jest.fn(),
}));

// Mock du style AOS
jest.mock('aos/dist/aos.css', () => ({}));

// Mock des icônes react-icons
jest.mock('react-icons/fa', () => ({
    FaStar: () => <div data-testid="star-icon">★</div>,
}));

describe('Team Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders team heading correctly', () => {
        render(<Team />);

        expect(screen.getByText('Notre')).toBeInTheDocument();
        expect(screen.getByText('Équipe')).toBeInTheDocument();
    });

    it('initializes AOS on mount', () => {
        render(<Team />);

        const aos = require('aos');
        expect(aos.init).toHaveBeenCalledWith({
            duration: 1000,
            once: true,
        });
    });

    it('renders all team members', () => {
        render(<Team />);

        const teamMembers = [
            'Thibault Jager',
            'Antoine Beaudoux',
            'Hugo Kerivel Larrivière',
            'Lucas Laruelle',
            'Nicolas Corlan',
            'Edmond Loembe',
            'Morgan FRARY',
            'Hajer Braham',
            'Sarah Delahaye'
        ];

        teamMembers.forEach(name => {
            expect(screen.getByText(name)).toBeInTheDocument();
        });
    });

    it('renders member images with correct attributes', () => {
        render(<Team />);

        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(9); // Nombre total de membres

        // Vérifie les attributs des images
        images.forEach(img => {
            expect(img).toHaveAttribute('class', expect.stringContaining('rounded-full'));
            expect(img).toHaveAttribute('alt', expect.any(String));
            expect(img).toHaveAttribute('src', expect.any(String));
        });
    });

    it('applies correct styling classes to container', () => {
        const { container } = render(<Team />);

        const mainContainer = container.firstChild;
        expect(mainContainer).toHaveClass('min-h-screen', 'bg-[#DCF0FF]', 'p-10', 'relative');
    });

    it('renders background pattern with correct attributes', () => {
        const { container } = render(<Team />);

        const backgroundPattern = container.querySelector('div[class*="absolute inset-0"]');
    });
});