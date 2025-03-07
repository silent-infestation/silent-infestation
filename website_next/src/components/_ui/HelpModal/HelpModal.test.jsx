import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HelpModal from './HelpModal';

describe('HelpModal Component', () => {
  test('renders correctly when open', () => {
    render(
      <HelpModal
        isOpen={true}
        onClose={jest.fn()}
        imageSrc="test-image.jpg"
        title="Test Title"
        text="Test text content"
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test text content')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'test-image.jpg');
  });

  test('does not render when closed', () => {
    render(
      <HelpModal
        isOpen={false}
        onClose={jest.fn()}
        imageSrc="test-image.jpg"
        title="Test Title"
        text="Test text content"
      />
    );

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const onCloseMock = jest.fn();

    render(
      <HelpModal
        isOpen={true}
        onClose={onCloseMock}
        imageSrc="test-image.jpg"
        title="Test Title"
        text="Test text content"
      />
    );

    fireEvent.click(screen.getByText(/×/));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
