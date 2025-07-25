import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard text', () => {
  render(<App />);
  const el = screen.getByText(/dashboard/i);
  expect(el).toBeInTheDocument();
});
