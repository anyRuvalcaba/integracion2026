import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterForm from '../RegisterForm';

function renderRegisterForm() {
  return render(
    <MemoryRouter>
      <RegisterForm />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('RegisterForm', () => {
  test('renderiza todos los campos del formulario', () => {
    renderRegisterForm();

    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/teléfono/i)).toBeInTheDocument();
    expect(screen.getByTestId('register-submit-button')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /inicia sesión/i })).toBeInTheDocument();
  });

  test('muestra error cuando nombre está vacío', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderRegisterForm();

    userEvent.click(screen.getByTestId('register-submit-button'));

    expect(screen.getByTestId('field-error-name')).toHaveTextContent(/nombre es requerido/i);
  });

  test('muestra error cuando email está vacío', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderRegisterForm();

    userEvent.type(screen.getByLabelText(/nombre completo/i), 'Test');
    userEvent.click(screen.getByTestId('register-submit-button'));

    expect(screen.getByTestId('field-error-email')).toHaveTextContent(/email es requerido/i);
  });

  test('muestra error cuando email tiene formato inválido', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderRegisterForm();

    userEvent.type(screen.getByLabelText(/nombre completo/i), 'Test User');
    userEvent.type(screen.getByLabelText(/^email/i), 'no-es-email');
    userEvent.click(screen.getByTestId('register-submit-button'));

    expect(screen.getByTestId('field-error-email')).toHaveTextContent(/formato válido/i);
  });

  test('muestra error cuando contraseña está vacía', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderRegisterForm();

    userEvent.type(screen.getByLabelText(/nombre completo/i), 'Test User');
    userEvent.type(screen.getByLabelText(/^email/i), 'test@test.com');
    userEvent.click(screen.getByTestId('register-submit-button'));

    expect(screen.getByTestId('field-error-password')).toHaveTextContent(/password es requerido/i);
  });

  test('muestra error cuando las contraseñas no coinciden', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderRegisterForm();

    userEvent.type(screen.getByLabelText(/nombre completo/i), 'Test User');
    userEvent.type(screen.getByLabelText(/^email/i), 'test@test.com');
    userEvent.type(screen.getByLabelText(/^contraseña \*/i), 'password1');
    userEvent.type(screen.getByLabelText(/confirmar contraseña/i), 'password2');
    userEvent.click(screen.getByTestId('register-submit-button'));

    expect(screen.getByTestId('field-error-confirmPassword')).toHaveTextContent(
      /contraseñas no coinciden/i,
    );
  });

  test('muestra error cuando teléfono tiene formato inválido', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderRegisterForm();

    userEvent.type(screen.getByLabelText(/nombre completo/i), 'Test User');
    userEvent.type(screen.getByLabelText(/^email/i), 'test@test.com');
    userEvent.type(screen.getByLabelText(/^contraseña \*/i), 'password1');
    userEvent.type(screen.getByLabelText(/confirmar contraseña/i), 'password1');
    userEvent.type(screen.getByLabelText(/teléfono/i), 'abc');
    userEvent.click(screen.getByTestId('register-submit-button'));

    expect(screen.getByTestId('field-error-phone')).toHaveTextContent(/formato válido/i);
  });

  test('registro exitoso navega a /login con justRegistered', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    const { container } = renderRegisterForm();

    userEvent.type(screen.getByLabelText(/nombre completo/i), 'Test User');
    userEvent.type(screen.getByLabelText(/^email/i), 'nuevo@test.com');
    userEvent.type(screen.getByLabelText(/^contraseña \*/i), 'password1');
    userEvent.type(screen.getByLabelText(/confirmar contraseña/i), 'password1');
    userEvent.click(screen.getByTestId('register-submit-button'));

    // After navigation the form unmounts; no error should appear
    await waitFor(() => {
      expect(screen.queryByTestId('field-error-name')).not.toBeInTheDocument();
      expect(screen.queryByTestId('field-error-email')).not.toBeInTheDocument();
    });
  });

  test('muestra error de email duplicado del backend', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderRegisterForm();

    userEvent.type(screen.getByLabelText(/nombre completo/i), 'Alice');
    userEvent.type(screen.getByLabelText(/^email/i), 'alice@ecommerce.com');
    userEvent.type(screen.getByLabelText(/^contraseña \*/i), 'password1');
    userEvent.type(screen.getByLabelText(/confirmar contraseña/i), 'password1');
    userEvent.click(screen.getByTestId('register-submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('field-error-email')).toHaveTextContent(
        /ya está registrado/i,
      );
    });
  });
});
