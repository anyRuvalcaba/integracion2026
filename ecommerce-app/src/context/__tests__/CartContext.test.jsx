import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import { CartProvider, useCart } from '../CartContext';

jest.mock('../../services/cartService', () => ({
  getCartByUser: jest.fn().mockRejectedValue({ kind: 'NOT_FOUND' }),
  createCart: jest.fn().mockResolvedValue({ _id: 'cart001', products: [] }),
  replaceCart: jest.fn().mockResolvedValue({ _id: 'cart001', products: [] }),
  clearCart: jest.fn().mockResolvedValue(),
}));

const SAMPLE_PRODUCT = {
  _id: 'prod001',
  name: 'Producto Test',
  price: 100,
  stock: 5,
  imagesUrl: ['https://placehold.co/600x400'],
};

const SAMPLE_PRODUCT_2 = {
  _id: 'prod002',
  name: 'Producto 2',
  price: 200,
  stock: 3,
  imagesUrl: [],
};

function CartTestConsumer() {
  const { items, count, total, addItem, updateQuantity, removeItem, clearCart } =
    useCart();

  return (
    <div>
      <span data-testid="count">{count}</span>
      <span data-testid="total">{total.toFixed(2)}</span>
      <span data-testid="items-length">{items.length}</span>
      {items.map((i) => (
        <div key={i.product._id} data-testid={`item-qty-${i.product._id}`}>
          {i.quantity}
        </div>
      ))}
      <button onClick={() => addItem(SAMPLE_PRODUCT, 1)}>add-p1</button>
      <button onClick={() => addItem(SAMPLE_PRODUCT_2, 1)}>add-p2</button>
      <button onClick={() => updateQuantity(SAMPLE_PRODUCT._id, 3)}>update-qty-3</button>
      <button onClick={() => updateQuantity(SAMPLE_PRODUCT._id, 0)}>update-qty-0</button>
      <button onClick={() => removeItem(SAMPLE_PRODUCT._id)}>remove-p1</button>
      <button onClick={clearCart}>clear</button>
    </div>
  );
}

function renderCart() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <CartProvider>
          <CartTestConsumer />
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  // cartService mocks default setup
  const cartService = require('../../services/cartService');
  cartService.getCartByUser.mockRejectedValue({ kind: 'NOT_FOUND' });
  cartService.createCart.mockResolvedValue({ _id: 'cart001', products: [] });
  cartService.replaceCart.mockResolvedValue({ _id: 'cart001', products: [] });
  cartService.clearCart.mockResolvedValue();
});

describe('CartContext', () => {
  test('estado inicial: items vacío, count=0, total=0', async () => {
    renderCart();
    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('0');
      expect(screen.getByTestId('total')).toHaveTextContent('0.00');
      expect(screen.getByTestId('items-length')).toHaveTextContent('0');
    });
  });

  test('addItem agrega un producto nuevo', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderCart();

    userEvent.click(screen.getByText('add-p1'));

    await waitFor(() => {
      expect(screen.getByTestId('count')).toHaveTextContent('1');
      expect(screen.getByTestId('items-length')).toHaveTextContent('1');
    });
  });

  test('addItem con dos productos diferentes agrega ambos', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderCart();

    userEvent.click(screen.getByText('add-p1'));
    userEvent.click(screen.getByText('add-p2'));

    await waitFor(() => {
      expect(screen.getByTestId('items-length')).toHaveTextContent('2');
      expect(screen.getByTestId('count')).toHaveTextContent('2');
    });
  });

  test('total se calcula correctamente (precio × cantidad)', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderCart();

    userEvent.click(screen.getByText('add-p1'));

    await waitFor(() => {
      expect(screen.getByTestId('total')).toHaveTextContent('100.00');
    });
  });

  test('updateQuantity actualiza la cantidad de un item', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderCart();

    userEvent.click(screen.getByText('add-p1'));
    await waitFor(() => expect(screen.getByTestId('items-length')).toHaveTextContent('1'));

    userEvent.click(screen.getByText('update-qty-3'));

    await waitFor(() => {
      expect(screen.getByTestId(`item-qty-${SAMPLE_PRODUCT._id}`)).toHaveTextContent('3');
      expect(screen.getByTestId('total')).toHaveTextContent('300.00');
    });
  });

  test('updateQuantity con cantidad 0 elimina el item', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderCart();

    userEvent.click(screen.getByText('add-p1'));
    await waitFor(() => expect(screen.getByTestId('items-length')).toHaveTextContent('1'));

    userEvent.click(screen.getByText('update-qty-0'));

    await waitFor(() => {
      expect(screen.getByTestId('items-length')).toHaveTextContent('0');
    });
  });

  test('removeItem elimina el item del carrito', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderCart();

    userEvent.click(screen.getByText('add-p1'));
    await waitFor(() => expect(screen.getByTestId('items-length')).toHaveTextContent('1'));

    userEvent.click(screen.getByText('remove-p1'));

    await waitFor(() => {
      expect(screen.getByTestId('items-length')).toHaveTextContent('0');
      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });
  });

  test('clearCart vacía todos los items', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderCart();

    userEvent.click(screen.getByText('add-p1'));
    userEvent.click(screen.getByText('add-p2'));
    await waitFor(() => expect(screen.getByTestId('items-length')).toHaveTextContent('2'));

    userEvent.click(screen.getByText('clear'));

    await waitFor(() => {
      expect(screen.getByTestId('items-length')).toHaveTextContent('0');
      expect(screen.getByTestId('count')).toHaveTextContent('0');
    });
  });

  test('persiste los items en localStorage', async () => {
    // userEvent v13 — no setup(), calls are synchronous
    renderCart();

    userEvent.click(screen.getByText('add-p1'));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('cart'));
      expect(Array.isArray(stored)).toBe(true);
      expect(stored.length).toBe(1);
      expect(stored[0].product._id).toBe(SAMPLE_PRODUCT._id);
    });
  });
});
