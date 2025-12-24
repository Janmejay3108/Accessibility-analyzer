import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page', () => {
  render(<App />);
  expect(screen.getByText(/log in/i)).toBeInTheDocument();
});
