import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext';
import LoginForm from '../LoginForm';

function renderLoginForm({ locationState = {} } = {}) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: locationState }]}>
      <AuthProvider>
        <LoginForm />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('LoginForm', () => {
  test('renderiza campos de email, contraseña y botón de login', () => {
    renderLoginForm();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByTestId('login-submit-button')).toBeInTheDocument();
  });

  test('muestra enlace de registro', () => {
    renderLoginForm();
    expect(screen.getByRole('link', { name: /regístrate/i })).toBeInTheDocument();
  });

  test('muestra mensaje de bienvenida tras registro exitoso cuando justRegistered=true', () => {
    renderLoginForm({ locationState: { justRegistered: true, email: 'test@test.com' } });
    expect(screen.getByText(/cuenta creada exitosamente/i)).toBeInTheDocument();
  });

  test('prefills email desde location.state', () => {
    renderLoginForm({ locationState: { email: 'preenviado@test.com' } });
    expect(screen.getByLabelText(/email/i)).toHaveValue('preenviado@test.com');
  });

  test('muestra estado de carga mientras hace la petición', async () => {
    const { mock } = require('../../../mocks/server');
    mock.reset();
    // Never-resolving reply keeps loading=true visible when the assertion runs
    mock.onPost('http://localhost:4000/api/auth/login').reply(() => new Promise(() => {}));

    renderLoginForm();

    userEvent.type(screen.getByLabelText(/email/i), 'alice@ecommerce.com');
    userEvent.type(screen.getByLabelText(/contraseña/i), 'password123');
    userEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(screen.getByText(/iniciando sesión\.\.\./i)).toBeInTheDocument();
    });
  });

  test('muestra error por credenciales inválidas', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderLoginForm();

    userEvent.type(screen.getByLabelText(/email/i), 'alice@ecommerce.com');
    userEvent.type(screen.getByLabelText(/contraseña/i), 'wrong-password');
    userEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(screen.getByText(/email o contraseña incorrectos/i)).toBeInTheDocument();
    });
  });

  test('botón vuelve a habilitarse tras error', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderLoginForm();

    userEvent.type(screen.getByLabelText(/email/i), 'alice@ecommerce.com');
    userEvent.type(screen.getByLabelText(/contraseña/i), 'wrong-password');
    userEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('login-submit-button')).not.toBeDisabled();
    });
  });

  test('login exitoso guarda el token en localStorage', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderLoginForm();

    userEvent.type(screen.getByLabelText(/email/i), 'alice@ecommerce.com');
    userEvent.type(screen.getByLabelText(/contraseña/i), 'password123');
    userEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBeTruthy();
    });
  });

  test('muestra RegisterErrorMessage cuando hay error de red', async () => {
    const { mock } = require('../../../mocks/server');
    // Override default login handler with network error for this test
    mock.reset();
    mock.onPost('http://localhost:4000/api/auth/login').networkError();

    // userEvent v13 — no setup(), calls are synchronous
    renderLoginForm();

    userEvent.type(screen.getByLabelText(/email/i), 'alice@ecommerce.com');
    userEvent.type(screen.getByLabelText(/contraseña/i), 'password123');
    userEvent.click(screen.getByTestId('login-submit-button'));

    await waitFor(() => {
      expect(
        screen.getByText(/no pudimos conectar|revisa tu conexión/i),
      ).toBeInTheDocument();
    });
  });
});
