// ./page.test.jsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Index from './page';

// Mock du composant Contact
jest.mock('@/components/Contact', () => {
  return function MockContact() {
    return <div data-testid="mock-contact">Contact Component</div>;
  };
});

describe.skip('Index Page', () => {
  it('rend correctement la page', () => {
    render(<Index />);
    expect(screen.getByTestId('mock-contact')).toBeInTheDocument();
  });

  it('rend le composant Contact', () => {
    render(<Index />);
    const contactComponent = screen.getByTestId('mock-contact');
    expect(contactComponent).toBeInTheDocument();
    expect(contactComponent).toHaveTextContent('Contact Component');
  });

  it('maintient la structure attendue de la page', () => {
    const { container } = render(<Index />);
    expect(container.firstChild?.childNodes).toHaveLength(1);
  });

  it('correspond au snapshot', () => {
    const { container } = render(<Index />);
    expect(container).toMatchSnapshot();
  });

  it('intègre correctement avec le composant Contact', () => {
    const { container } = render(<Index />);
    const contactElement = screen.getByTestId('mock-contact');
    expect(contactElement).toBeInTheDocument();
    expect(container.firstChild).toContainElement(contactElement);
  });
});
