import React from 'react';
import { render, screen, act } from '@testing-library/react';
import Contact from '.';

// Mock des composants externes
jest.mock('../_ui/Forms/FormTemplate', () => {
  return function MockFormTemplate({ fields, onSubmit }) {
    return (
      <form
        data-testid="form-template"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = {
            email: e.target.email.value,
            subject: e.target.subject.value,
            message: e.target.message.value,
          };
          onSubmit(formData);
        }}
      >
        <input data-testid="email-input" name="email" />
        <input data-testid="subject-input" name="subject" />
        <textarea data-testid="message-input" name="message" />
        <button type="submit">Submit</button>
      </form>
    );
  };
});

jest.mock('../Alerte/Alerte', () => {
  return function MockAlert({ isShowingAlert, alertTitle }) {
    if (!isShowingAlert) return null;
    return <div data-testid="alert">{alertTitle}</div>;
  };
});

jest.mock('@/locales', () => ({
  contact: {
    title: 'Contact Title',
    description: 'Contact Description',
  },
}));

describe('Contact Component', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllTimers();
  });

  it('renders the contact form with title and description', () => {
    act(() => {
      render(<Contact />);
    });

    expect(screen.getByText('Contact Title')).toBeInTheDocument();
    expect(screen.getByText('Contact Description')).toBeInTheDocument();
    expect(screen.getByTestId('form-template')).toBeInTheDocument();
  });
});