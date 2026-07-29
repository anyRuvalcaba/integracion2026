Cypress.Commands.add('loginByApi', ({ email, password }) => {
  cy.session(
    [email],
    () => {
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/auth/login`,
        body: { email, password },
        log: false,
      }).then(({ status, body }) => {
        expect(status).to.eq(200);
        window.localStorage.setItem('authToken', body.token);
      });
    },
    {
      validate() {
        const token = window.localStorage.getItem('authToken');
        expect(token).to.be.a('string').and.not.be.empty;
      },
    },
  );
});

Cypress.Commands.add('addProductToCart', ({ productId, quantity = 1 }) => {
  cy.visit(`/product/${productId}`);
  cy.get('[data-testid="product-detail"]', { timeout: 10000 }).should('be.visible');
  cy.get('[data-testid="add-to-cart-button"]').should('not.be.disabled').click();
  cy.get('[data-testid="cart-count"]').should('be.visible');
});
