import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProtectedRoute from '../ProtectedRoute';

jest.mock('../../context/AuthContext');

function renderRoute({ authValue, allowedRoles } = {}) {
  useAuth.mockReturnValue(authValue);

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Contenido protegido</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Página de login</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  test('retorna null mientras loading es true', () => {
    const { container } = renderRoute({
      authValue: { user: null, isAuthenticated: false, loading: true },
    });
    expect(container).toBeEmptyDOMElement();
  });

  test('redirige a /login cuando el usuario no está autenticado', () => {
    renderRoute({
      authValue: { user: null, isAuthenticated: false, loading: false },
    });
    expect(screen.getByText('Página de login')).toBeInTheDocument();
  });

  test('muestra "Acceso denegado" cuando el rol no está permitido', () => {
    renderRoute({
      authValue: {
        user: { id: '1', name: 'Alice', role: 'customer' },
        isAuthenticated: true,
        loading: false,
      },
      allowedRoles: ['admin'],
    });
    expect(screen.getByText(/acceso denegado/i)).toBeInTheDocument();
  });

  test('renderiza los children cuando el usuario tiene el rol permitido', () => {
    renderRoute({
      authValue: {
        user: { id: '1', name: 'Alice', role: 'customer' },
        isAuthenticated: true,
        loading: false,
      },
      allowedRoles: ['customer', 'admin'],
    });
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  test('renderiza children cuando no se especifican roles (cualquier usuario autenticado)', () => {
    renderRoute({
      authValue: {
        user: { id: '1', name: 'Alice', role: 'customer' },
        isAuthenticated: true,
        loading: false,
      },
    });
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });
});
