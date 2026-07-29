describe('Login de usuario', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('renderiza campos email, password, botón y enlace a registro', () => {
    cy.get('input#email').should('be.visible');
    cy.get('input#password').should('be.visible');
    cy.get('[data-testid="login-submit-button"]').should('be.visible');
    cy.get('a[href="/register"]').should('be.visible');
  });

  it('muestra error por credenciales incorrectas', () => {
    cy.intercept('POST', '**/auth/login').as('loginRequest');

    cy.get('input#email').type('alice@ecommerce.com');
    cy.get('input#password').type('wrong-password');
    cy.get('[data-testid="login-submit-button"]').click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 400);
    cy.contains(/email o contraseña incorrectos/i).should('be.visible');
  });

  it('login exitoso guarda el token y redirige al home', () => {
    cy.intercept('POST', '**/auth/login').as('loginRequest');

    cy.get('input#email').type('alice@ecommerce.com');
    cy.get('input#password').type('password123');
    cy.get('[data-testid="login-submit-button"]').click();

    cy.wait('@loginRequest').its('response.statusCode').should('eq', 200);
    cy.window().its('localStorage').invoke('getItem', 'authToken').should('be.a', 'string').and.not.be.empty;
    cy.url().should('not.include', '/login');
  });

  it('persiste la sesión tras recargar la página', () => {
    cy.loginByApi({
      email: Cypress.env('TEST_USER_EMAIL') || 'alice@ecommerce.com',
      password: Cypress.env('TEST_USER_PASSWORD') || 'password123',
    });
    cy.visit('/');
    cy.reload();
    cy.window().its('localStorage').invoke('getItem', 'authToken').should('be.a', 'string').and.not.be.empty;
  });

  it('redirige a /login al intentar acceder a una ruta protegida sin sesión', () => {
    cy.clearLocalStorage();
    cy.visit('/checkout');
    cy.url().should('include', '/login');
  });
});
