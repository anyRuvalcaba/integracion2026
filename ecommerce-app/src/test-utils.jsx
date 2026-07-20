import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

export function renderWithProviders(ui, { route = '/', initialEntries } = {}) {
  const entries = initialEntries || [route];
  return render(
    <MemoryRouter initialEntries={entries}>
      <AuthProvider>
        <CartProvider>{ui}</CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

// Builds a fake JWT parseable by decodeToken() in auth.js
export function createFakeToken({ role = 'customer', exp = 9999999999 } = {}) {
  const payload = JSON.stringify({ userId: 'user123', name: 'Test User', role, iat: 1, exp });
  const payloadB64 = Buffer.from(payload).toString('base64');
  return `eyJhbGciOiJub25lIn0.${payloadB64}.fakesig`;
}

export function setFakeAuth(role = 'customer') {
  localStorage.setItem('authToken', createFakeToken({ role }));
}

export function clearFakeAuth() {
  localStorage.removeItem('authToken');
}
