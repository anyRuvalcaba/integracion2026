import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import ProductCard from '../ProductCard';

jest.mock('../../../context/CartContext');

const PRODUCT_IN_STOCK = {
  _id: 'prod001',
  name: 'Producto En Stock',
  description: 'Una descripción',
  price: 199.99,
  stock: 10,
  imageURL: 'https://placehold.co/600x400',
};

const PRODUCT_OUT_OF_STOCK = {
  _id: 'prod002',
  name: 'Producto Agotado',
  description: 'Sin stock',
  price: 50,
  stock: 0,
  imageURL: '',
};

function renderProductCard(product) {
  return render(
    <MemoryRouter>
      <ProductCard product={product} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useCart.mockReturnValue({ addItem: jest.fn() });
});

describe('ProductCard', () => {
  test('renderiza nombre, precio e imagen del producto', () => {
    renderProductCard(PRODUCT_IN_STOCK);

    expect(screen.getByText('Producto En Stock')).toBeInTheDocument();
    expect(screen.getByText('$199.99')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /producto en stock/i })).toBeInTheDocument();
  });

  test('muestra badge "En stock" cuando stock > 0', () => {
    renderProductCard(PRODUCT_IN_STOCK);
    expect(screen.getByText('En stock')).toBeInTheDocument();
  });

  test('muestra badge "Agotado" y botón deshabilitado cuando stock === 0', () => {
    renderProductCard(PRODUCT_OUT_OF_STOCK);

    expect(screen.getByText('Agotado')).toBeInTheDocument();
    expect(screen.getByTestId('add-to-cart-button')).toBeDisabled();
  });

  test('el enlace de la imagen navega a /product/{id}', () => {
    renderProductCard(PRODUCT_IN_STOCK);
    const links = screen.getAllByRole('link');
    const productLinks = links.filter((l) =>
      l.getAttribute('href')?.includes('/product/prod001'),
    );
    expect(productLinks.length).toBeGreaterThan(0);
  });

  test('click en "Agregar al carrito" llama addItem con el producto', async () => {
    const mockAddItem = jest.fn();
    useCart.mockReturnValue({ addItem: mockAddItem });

    // userEvent v13 — no setup()
    renderProductCard(PRODUCT_IN_STOCK);

    userEvent.click(screen.getByTestId('add-to-cart-button'));

    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(mockAddItem).toHaveBeenCalledWith(PRODUCT_IN_STOCK, 1);
  });

  test('muestra mensaje cuando product es null', () => {
    render(<MemoryRouter><ProductCard product={null} /></MemoryRouter>);
    expect(screen.getByText(/producto no disponible/i)).toBeInTheDocument();
  });
});
