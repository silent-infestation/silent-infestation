import { render, screen } from '@testing-library/react';
import About from './About'; // Assurez-vous que le chemin est correct
import AOS from 'aos';

// Mock de AOS pour éviter d'exécuter l'animation réelle
jest.mock('aos', () => ({
  init: jest.fn(),
}));

describe('About Component', () => {
  test('Le composant se rend sans erreur', () => {
    render(<About />);
  });

  test('AOS est initialisé au montage', () => {
    render(<About />);
    expect(AOS.init).toHaveBeenCalled();
  });

  test('Le titre principal est bien affiché', () => {
    render(<About />);
    expect(screen.getByText(/À propos de/i)).toBeInTheDocument();
  });

  test('Toutes les sections importantes sont présentes', () => {
    render(<About />);

    expect(screen.getByText(/Qui sommes-nous/i)).toBeInTheDocument();
    expect(screen.getByText(/Notre mission/i)).toBeInTheDocument();
    expect(screen.getByText(/Nos services/i)).toBeInTheDocument();
    expect(screen.getByText(/Pourquoi nous choisir/i)).toBeInTheDocument();
    expect(screen.getByText(/Engagement envers la confidentialité/i)).toBeInTheDocument();
  });
});
