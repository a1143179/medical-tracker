import { render, screen } from '@testing-library/react';
import App from './App';

test('renders loading text when app is initializing', () => {
  render(<App />);
  const loadingElement = screen.getByText(/loading/i);
  expect(loadingElement).toBeInTheDocument();
});
