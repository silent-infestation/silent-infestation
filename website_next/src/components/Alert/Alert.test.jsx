import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Alert from './Alert';

// Mock framer-motion pour éviter les problèmes avec les animations dans les tests
jest.mock('framer-motion', () => ({
  motion: {
    section: ({ children, className }) => <section className={className}>{children}</section>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('Alert Component', () => {
  it('should not render when isShowingAlert is false', () => {
    render(<Alert isShowingAlert={false} isAlertErrorMessage={false} alertTitle="Test Message" />);

    const alert = screen.queryByText('Test Message');
    expect(alert).not.toBeInTheDocument();
  });

  it('should render with error styles when isAlertErrorMessage is true', () => {
    render(<Alert isShowingAlert={true} isAlertErrorMessage={true} alertTitle="Error Message" />);

    const alert = screen.getByText('Error Message');
    const section = alert.parentElement;
    expect(section).toHaveClass('bg-black', 'text-white');
  });

  it('should render with success styles when isAlertErrorMessage is false', () => {
    render(
      <Alert isShowingAlert={true} isAlertErrorMessage={false} alertTitle="Success Message" />
    );

    const alert = screen.getByText('Success Message');
    const section = alert.parentElement;
    expect(section).toHaveClass('bg-green-500', 'text-black');
  });

  it('should display the correct alert title', () => {
    const testTitle = 'Custom Alert Message';
    render(<Alert isShowingAlert={true} isAlertErrorMessage={false} alertTitle={testTitle} />);

    expect(screen.getByText(testTitle)).toBeInTheDocument();
  });

  it('should have the correct base classes regardless of alert type', () => {
    render(<Alert isShowingAlert={true} isAlertErrorMessage={false} alertTitle="Test Message" />);

    const section = screen.getByText('Test Message').parentElement;
    expect(section).toHaveClass('fixed', 'top-0', 'left-0', 'w-full', 'text-center', 'p-2', 'z-50');
  });
});
