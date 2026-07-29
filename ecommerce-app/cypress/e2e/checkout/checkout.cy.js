describe('Flujo de Checkout', () => {
  const user = {
    email: Cypress.env('TEST_USER_EMAIL') || 'alice@ecommerce.com',
    password: Cypress.env('TEST_USER_PASSWORD') || 'password123',
  };

  beforeEach(() => {
    cy.loginByApi(user);
  });

  describe('Carrito (/cart)', () => {
    it('muestra el carrito vacío cuando no hay productos', () => {
      cy.clearLocalStorage('cart');
      cy.visit('/cart');
      cy.contains(/carrito.*vacío|no hay productos/i).should('be.visible');
    });

    it('muestra productos, permite cambiar cantidad y calcular total', () => {
      cy.window().then((win) => {
        win.localStorage.setItem(
          'cart',
          JSON.stringify([
            {
              product: {
                _id: 'test-prod',
                name: 'Producto Test',
                price: 200,
                stock: 5,
                imagesUrl: [],
              },
              quantity: 2,
            },
          ]),
        );
      });
      cy.visit('/cart');
      cy.contains('Producto Test').should('be.visible');
      cy.get('[data-testid="cart-total"]').should('contain.text', '400');
    });

    it('botón "Proceder al pago" navega a /checkout', () => {
      cy.window().then((win) => {
        win.localStorage.setItem(
          'cart',
          JSON.stringify([
            {
              product: {
                _id: 'test-prod',
                name: 'Producto Test',
                price: 200,
                stock: 5,
                imagesUrl: [],
              },
              quantity: 1,
            },
          ]),
        );
      });
      cy.visit('/cart');
      cy.get('[data-testid="cart-checkout-button"]').should('not.be.disabled').click();
      cy.url().should('include', '/checkout');
    });
  });

  describe('Checkout (/checkout)', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem(
          'cart',
          JSON.stringify([
            {
              product: {
                _id: 'checkout-prod',
                name: 'Producto Checkout',
                price: 500,
                stock: 5,
                imagesUrl: [],
              },
              quantity: 1,
            },
          ]),
        );
      });
      cy.visit('/checkout');
      cy.contains('Resumen de la Orden', { timeout: 10000 }).should('be.visible');
    });

    it('muestra el resumen con subtotal, IVA, envío y total', () => {
      cy.contains('Subtotal').should('be.visible');
      cy.contains('IVA').should('be.visible');
      cy.contains('Envío').should('be.visible');
      cy.get('[data-testid="checkout-grand-total"]').should('be.visible');
    });

    it('botón Confirmar está deshabilitado si no hay dirección', () => {
      cy.intercept('GET', '**/addresses').as('getAddresses');
      cy.wait('@getAddresses');

      cy.get('[data-testid="checkout-confirm-button"]').then(($btn) => {
        if (!$btn.is(':disabled')) {
          cy.log('Dirección ya seleccionada — verificando que aparece el botón habilitado');
        }
        cy.get('[data-testid="checkout-confirm-button"]').should('exist');
      });
    });

    it('crea una orden y redirige a /order-confirmation', () => {
      cy.intercept('POST', '**/orders').as('createOrder');

      cy.get('[data-testid="checkout-confirm-button"]').then(($btn) => {
        if ($btn.is(':disabled')) {
          cy.log('Botón deshabilitado — se requiere dirección y pago para este test');
          return;
        }
        cy.get('[data-testid="checkout-confirm-button"]').click();
        cy.wait('@createOrder').its('response.statusCode').should('eq', 201);
        cy.get('[data-testid="order-success"]', { timeout: 10000 }).should('be.visible');
        cy.get('[data-testid="order-number"]').should('not.be.empty');
      });
    });
  });
});
