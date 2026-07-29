// Mock data shared between test files
const fakePayload = JSON.stringify({
  userId: 'user123',
  name: 'Test User',
  role: 'customer',
  iat: 1,
  exp: 9999999999,
});
const fakePayloadB64 = Buffer.from(fakePayload).toString('base64');
export const TEST_TOKEN = `eyJhbGciOiJub25lIn0.${fakePayloadB64}.fakesig`;

export const SAMPLE_PRODUCTS = [
  {
    _id: 'prod001',
    name: 'Teclado Mecánico',
    description: 'Switches Cherry MX Blue.',
    price: 899,
    stock: 10,
    imageURL: 'https://placehold.co/600x400',
    category: { _id: 'cat001', name: 'Periféricos' },
  },
  {
    _id: 'prod002',
    name: 'Mouse Gamer',
    description: 'Mouse de alta precisión.',
    price: 499,
    stock: 0,
    imageURL: 'https://placehold.co/600x400',
    category: { _id: 'cat001', name: 'Periféricos' },
  },
];

export const SAMPLE_ADDRESS = {
  _id: 'addr001',
  address: 'Av. Siempreviva 742',
  city: 'Springfield',
  state: 'CDMX',
  postalCode: '06700',
  country: 'México',
  phone: '5512345678',
  isDefault: true,
};

export const SAMPLE_PAYMENT = {
  _id: 'pay001',
  type: 'cash_on_delivery',
  isDefault: true,
  isActive: true,
};

const BASE = 'http://localhost:4000/api';

/**
 * Registers default mock routes on an axios-mock-adapter instance.
 * Call after mock.reset() in beforeEach.
 */
export function setupDefaultMocks(mock) {
  // Auth
  mock.onPost(`${BASE}/auth/login`).reply((config) => {
    const { email, password } = JSON.parse(config.data);
    if (email === 'alice@ecommerce.com' && password === 'password123') {
      return [200, { token: TEST_TOKEN, refreshToken: 'fake-refresh' }];
    }
    return [400, { message: 'Invalid Credentials' }];
  });

  mock.onPost(`${BASE}/auth/register`).reply((config) => {
    const body = JSON.parse(config.data);
    if (body.email === 'alice@ecommerce.com') {
      return [400, { message: 'User already exist' }];
    }
    return [201, { _id: 'new-user-id', name: body.name, email: body.email }];
  });

  // Products
  mock.onGet(`${BASE}/products`).reply(200, SAMPLE_PRODUCTS);
  SAMPLE_PRODUCTS.forEach((p) => {
    mock.onGet(`${BASE}/products/${p._id}`).reply(200, p);
  });
  mock.onGet(new RegExp(`${BASE}/products/.+`)).reply(404, { message: 'Not found' });

  // Cart
  mock.onGet(new RegExp(`${BASE}/cart/user/.+`)).reply(404, { kind: 'NOT_FOUND' });
  mock.onPost(`${BASE}/cart`).reply(201, { _id: 'cart001', user: 'user123', products: [] });
  mock.onPut(new RegExp(`${BASE}/cart/.+`)).reply(200, { _id: 'cart001', user: 'user123', products: [] });
  mock.onDelete(new RegExp(`${BASE}/cart/.+`)).reply(204);

  // Addresses
  mock.onGet(`${BASE}/addresses`).reply(200, [SAMPLE_ADDRESS]);
  mock.onPost(`${BASE}/addresses`).reply(201, SAMPLE_ADDRESS);
  mock.onPut(new RegExp(`${BASE}/addresses/.+`)).reply(200, SAMPLE_ADDRESS);
  mock.onDelete(new RegExp(`${BASE}/addresses/.+`)).reply(204);

  // Payment methods
  mock.onGet(`${BASE}/payment-methods/me`).reply(200, [SAMPLE_PAYMENT]);
  mock.onGet(`${BASE}/payment-methods`).reply(200, [SAMPLE_PAYMENT]);
  mock.onPost(`${BASE}/payment-methods`).reply(201, SAMPLE_PAYMENT);
  mock.onPut(new RegExp(`${BASE}/payment-methods/.+`)).reply(200, SAMPLE_PAYMENT);
  mock.onDelete(new RegExp(`${BASE}/payment-methods/.+`)).reply(204);

  // Orders
  mock.onPost(`${BASE}/orders`).reply(201, {
    _id: 'order001',
    status: 'pending',
    paymentStatus: 'pending',
  });
}
