import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { getProductById } from '../../../services/productsService';
import ProductDetails from '../ProductDetails';

jest.mock('../../../context/CartContext');
jest.mock('../../../services/productsService');

const SAMPLE_PRODUCT = {
  _id: 'prod001',
  name: 'Teclado Mecánico',
  description: 'Teclado con switches Cherry MX Blue.',
  price: 899,
  stock: 10,
  imagesUrl: ['https://placehold.co/600x400'],
  category: { name: 'Periféricos', id: 'cat001' },
};

function renderDetails(productId = 'prod001') {
  return render(
    <MemoryRouter>
      <ProductDetails productId={productId} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useCart.mockReturnValue({ addItem: jest.fn() });
});

describe('ProductDetails', () => {
  test('muestra skeleton de carga durante fetch', () => {
    getProductById.mockReturnValue(new Promise(() => {})); // never resolves
    renderDetails();
    // Skeleton renders a div with animation class
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('renderiza nombre, precio y descripción al resolver', async () => {
    getProductById.mockResolvedValue(SAMPLE_PRODUCT);
    renderDetails();

    await waitFor(() => {
      expect(screen.getByTestId('product-detail')).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'Teclado Mecánico' })).toBeInTheDocument();
    expect(screen.getByText('$899')).toBeInTheDocument();
    expect(screen.getByText(/Cherry MX Blue/i)).toBeInTheDocument();
    expect(screen.getByText('En stock')).toBeInTheDocument();
  });

  test('muestra "Producto no encontrado" ante error NOT_FOUND', async () => {
    getProductById.mockRejectedValue({ kind: 'NOT_FOUND' });
    renderDetails();

    await waitFor(() => {
      expect(screen.getByText('Producto no encontrado')).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /volver al catálogo/i })).toBeInTheDocument();
  });

  test('muestra mensaje de conexión ante error NETWORK', async () => {
    getProductById.mockRejectedValue({ kind: 'NETWORK' });
    renderDetails();

    await waitFor(() => {
      expect(
        screen.getByText(/no pudimos conectar con el servidor/i),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  test('click en "Agregar al carrito" llama addItem con el producto', async () => {
    const mockAddItem = jest.fn();
    useCart.mockReturnValue({ addItem: mockAddItem });
    getProductById.mockResolvedValue(SAMPLE_PRODUCT);

    // userEvent v13 — no setup()
    renderDetails();

    await waitFor(() => {
      expect(screen.getByTestId('add-to-cart-button')).toBeInTheDocument();
    });

    userEvent.click(screen.getByTestId('add-to-cart-button'));

    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(mockAddItem).toHaveBeenCalledWith(SAMPLE_PRODUCT, 1);
  });

  test('muestra badge "Agotado" y botón deshabilitado cuando stock === 0', async () => {
    getProductById.mockResolvedValue({ ...SAMPLE_PRODUCT, stock: 0 });
    renderDetails();

    await waitFor(() => {
      expect(screen.getByTestId('product-detail')).toBeInTheDocument();
    });

    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(screen.getByTestId('add-to-cart-button')).toBeDisabled();
  });
});
