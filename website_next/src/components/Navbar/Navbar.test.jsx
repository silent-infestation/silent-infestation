import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Navbar from '.';

// Mock des composants Next.js
jest.mock('next/link', () => {
  function MockLink({ children, href }) {
    return <a href={href}>{children}</a>;
  }

  return MockLink;
});

jest.mock('next/image', () => {
  function MockNextImage({ src, alt, width, height, className }) {
    return <img src={src} alt={alt} width={width} height={height} className={className} />;
  }

  return MockNextImage;
});

// Mock des icônes react-icons
jest.mock('react-icons/fi', () => ({
  FiMenu: () => <div data-testid="menu-icon">Menu Icon</div>,
  FiX: () => <div data-testid="close-icon">Close Icon</div>,
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    // Reset window width à desktop pour chaque test
    global.innerWidth = 1024;
    global.dispatchEvent(new Event('resize'));
  });

  it('renders logo and initial navigation state', () => {
    render(<Navbar />);

    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(screen.getByText('Connexion')).toBeInTheDocument();
    expect(screen.getByText('Inscription')).toBeInTheDocument();
  });

  it('toggles authentication state correctly', async () => {
    render(<Navbar />);

    // État initial - non authentifié
    expect(screen.getByText('Connexion')).toBeInTheDocument();

    // Login
    await act(async () => {
      fireEvent.click(screen.getByText('Connexion'));
    });

    // Vérifie les liens qui apparaissent après connexion
    expect(screen.getByText('Profil')).toBeInTheDocument();
    expect(screen.getByText('Historique')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Déconnexion')).toBeInTheDocument();

    // Logout
    await act(async () => {
      fireEvent.click(screen.getByText('Déconnexion'));
    });

    // Vérifie le retour à l'état initial
    expect(screen.getByText('Connexion')).toBeInTheDocument();
  });

  describe('Mobile Menu', () => {
    beforeEach(() => {
      // Simule une largeur d'écran mobile
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));
    });

    it('shows and hides mobile menu correctly', async () => {
      render(<Navbar />);

      // Vérifie que l'icône du menu est visible
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();

      // Ouvre le menu
      await act(async () => {
        fireEvent.click(screen.getByTestId('menu-icon'));
      });

      // Vérifie que le menu est ouvert
      expect(screen.getByTestId('close-icon')).toBeInTheDocument();

      // Ferme le menu
      await act(async () => {
        fireEvent.click(screen.getByTestId('close-icon'));
      });

      // Vérifie que le menu est fermé
      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('renders correct links when authenticated', async () => {
      render(<Navbar />);

      // Login
      await act(async () => {
        fireEvent.click(screen.getByText('Connexion'));
      });

      // Vérifie les liens
      const profileLink = screen.getByText('Profil').closest('a');
      const historyLink = screen.getByText('Historique').closest('a');
      const contactLink = screen.getByText('Contact').closest('a');

      expect(profileLink).toHaveAttribute('href', '/profile');
      expect(historyLink).toHaveAttribute('href', '/history');
      expect(contactLink).toHaveAttribute('href', '/contact');
    });

    it('renders logo link correctly', () => {
      render(<Navbar />);

      const logoLink = screen.getByAltText('Logo').closest('a');
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });

  describe('Responsive Design', () => {
    it('shows desktop navigation on large screens', () => {
      global.innerWidth = 1024;
      global.dispatchEvent(new Event('resize'));

      render(<Navbar />);

      const desktopNav = document.querySelector('.hidden.md\\:flex');
      expect(desktopNav).toBeInTheDocument();
    });

    it('shows mobile menu button on small screens', () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<Navbar />);

      expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    });
  });
});
