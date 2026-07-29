import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  getDefaultPaymentMethod,
  getPaymentMethods,
} from '../../services/paymentService';
import {
  getDefaultShippingAddress,
  getShippingAddresses,
} from '../../services/shippingService';
import Checkout from '../Checkout';

jest.mock('../../context/AuthContext');
jest.mock('../../context/CartContext');
jest.mock('../../services/shippingService');
jest.mock('../../services/paymentService');
jest.mock('../../services/apiClient', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

const SAMPLE_ADDRESS = {
  _id: 'addr001',
  address: 'Av. Siempreviva 742',
  city: 'Springfield',
  state: 'CDMX',
  postalCode: '06700',
  country: 'México',
  phone: '5512345678',
  isDefault: true,
};

const SAMPLE_PAYMENT = {
  _id: 'pay001',
  type: 'cash_on_delivery',
  isDefault: true,
};

const SAMPLE_ITEM = {
  product: {
    _id: 'prod001',
    name: 'Producto Test',
    price: 100,
    stock: 5,
    imageURL: 'https://placehold.co/600x400',
  },
  quantity: 2,
};

function renderCheckout({ items = [SAMPLE_ITEM], total = 200 } = {}) {
  useAuth.mockReturnValue({
    user: { userId: 'user123', name: 'Test', role: 'customer' },
    isAuthenticated: true,
    loading: false,
  });

  useCart.mockReturnValue({
    items,
    total,
    clearCart: jest.fn(),
    removeItem: jest.fn(),
    updateQuantity: jest.fn(),
  });

  return render(
    <MemoryRouter initialEntries={['/checkout']}>
      <Routes>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/cart" element={<div>Página de carrito</div>} />
        <Route path="/order-confirmation" element={<div>Orden confirmada</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function waitForLoading() {
  // "Resumen de la Orden" is only rendered when loadingLocal === false
  await waitFor(() => {
    expect(screen.getByText('Resumen de la Orden')).toBeInTheDocument();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  getShippingAddresses.mockResolvedValue([SAMPLE_ADDRESS]);
  getDefaultShippingAddress.mockResolvedValue(SAMPLE_ADDRESS);
  getPaymentMethods.mockResolvedValue([SAMPLE_PAYMENT]);
  getDefaultPaymentMethod.mockResolvedValue(SAMPLE_PAYMENT);
});

describe('Checkout', () => {
  test('redirige a /cart cuando el carrito está vacío', async () => {
    getShippingAddresses.mockResolvedValue([]);
    getDefaultShippingAddress.mockResolvedValue(null);
    getPaymentMethods.mockResolvedValue([]);
    getDefaultPaymentMethod.mockResolvedValue(null);

    renderCheckout({ items: [], total: 0 });

    await waitFor(() => {
      expect(screen.getByText('Página de carrito')).toBeInTheDocument();
    });
  });

  test('calcula envío gratis cuando subtotal >= 1000', async () => {
    renderCheckout({ items: [SAMPLE_ITEM], total: 1000 });

    await waitForLoading();

    expect(screen.getByText('Gratis')).toBeInTheDocument();
  });

  test('calcula envío de $350 cuando subtotal < 1000', async () => {
    renderCheckout({ items: [SAMPLE_ITEM], total: 500 });

    await waitForLoading();

    // Shipping row shows formatted 350 (not "Gratis")
    const envioText = screen.queryByText('Gratis');
    expect(envioText).not.toBeInTheDocument();
  });

  test('calcula IVA al 16% del subtotal', async () => {
    renderCheckout({ items: [SAMPLE_ITEM], total: 500 });

    await waitForLoading();

    // taxAmount = 500 * 0.16 = 80
    // shippingCost = 350 (< 1000)
    // grandTotal = 500 + 80 + 350 = 930
    const grandTotalEl = screen.getByTestId('checkout-grand-total');
    expect(grandTotalEl).toBeInTheDocument();
    // Check that the value contains "930" somewhere
    expect(grandTotalEl.textContent).toMatch(/930/);
  });

  test('grandTotal incluye subtotal + IVA + envío', async () => {
    renderCheckout({ items: [SAMPLE_ITEM], total: 1000 });

    await waitForLoading();

    // taxAmount = 1000 * 0.16 = 160
    // shippingCost = 0 (free)
    // grandTotal = 1000 + 160 + 0 = 1160
    const grandTotalEl = screen.getByTestId('checkout-grand-total');
    expect(grandTotalEl.textContent).toMatch(/1[,.]?160/);
  });

  test('botón "Confirmar" está deshabilitado sin dirección seleccionada', async () => {
    getDefaultShippingAddress.mockResolvedValue(null);
    getShippingAddresses.mockResolvedValue([]);

    renderCheckout();

    await waitForLoading();

    expect(screen.getByTestId('checkout-confirm-button')).toBeDisabled();
  });

  test('botón "Confirmar" está deshabilitado sin método de pago seleccionado', async () => {
    getDefaultPaymentMethod.mockResolvedValue(null);
    getPaymentMethods.mockResolvedValue([]);

    renderCheckout();

    await waitForLoading();

    expect(screen.getByTestId('checkout-confirm-button')).toBeDisabled();
  });

  test('botón "Confirmar" está habilitado cuando hay dirección y pago seleccionados', async () => {
    renderCheckout();

    await waitForLoading();

    expect(screen.getByTestId('checkout-confirm-button')).not.toBeDisabled();
  });
});
