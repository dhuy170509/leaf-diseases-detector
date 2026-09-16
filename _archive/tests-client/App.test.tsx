import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../../src/App';

const renderWithRouter = (ui: React.ReactElement) =>
  render(<BrowserRouter>{ui}</BrowserRouter>);

describe('App Component', () => {
  test('renders the app title', () => {
    renderWithRouter(<App />);
    expect(screen.getByText(/Leaf Disease Detector/i)).toBeInTheDocument();
  });

  test('renders the image uploader component', () => {
    renderWithRouter(<App />);
    expect(screen.getByText(/Upload Image/i)).toBeInTheDocument();
  });

  test('renders the prediction view component', () => {
    renderWithRouter(<App />);
    expect(screen.getByText(/Prediction Results/i)).toBeInTheDocument();
  });
});