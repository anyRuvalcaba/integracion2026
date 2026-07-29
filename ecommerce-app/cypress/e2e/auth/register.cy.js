import { uniqueEmail, newUser } from '../../utils/testData.js';

describe('Registro de usuario', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  it('renderiza todos los campos del formulario', () => {
    cy.get('input#name').should('be.visible');
    cy.get('input#email').should('be.visible');
    cy.get('input#password').should('be.visible');
    cy.get('input#confirmPassword').should('be.visible');
    cy.get('[data-testid="register-submit-button"]').should('be.visible');
    cy.get('a[href="/login"]').should('be.visible');
  });

  it('muestra errores de validación cuando el formulario se envía vacío', () => {
    cy.intercept('POST', '**/auth/register').as('registerRequest');

    cy.get('[data-testid="register-submit-button"]').click();

    cy.get('[data-testid="field-error-name"]').should('contain.text', 'nombre es requerido');
    cy.get('@registerRequest.all').should('have.length', 0);
  });

  it('muestra error cuando email tiene formato inválido', () => {
    cy.intercept('POST', '**/auth/register').as('registerRequest');

    cy.get('input#name').type('Test User');
    cy.get('input#email').type('no-es-un-email');
    cy.get('[data-testid="register-submit-button"]').click();

    cy.get('[data-testid="field-error-email"]').should('contain.text', 'formato');
    cy.get('@registerRequest.all').should('have.length', 0);
  });

  it('muestra error cuando las contraseñas no coinciden', () => {
    cy.intercept('POST', '**/auth/register').as('registerRequest');

    cy.get('input#name').type('Test User');
    cy.get('input#email').type('test@test.com');
    cy.get('input#password').type('password1');
    cy.get('input#confirmPassword').type('password2');
    cy.get('[data-testid="register-submit-button"]').click();

    cy.get('[data-testid="field-error-confirmPassword"]').should(
      'contain.text',
      'no coinciden',
    );
    cy.get('@registerRequest.all').should('have.length', 0);
  });

  it('registro exitoso redirige a /login', () => {
    cy.intercept('POST', '**/auth/register').as('registerRequest');

    const email = uniqueEmail('reg');
    const user = newUser(email);

    cy.get('input#name').type(user.name);
    cy.get('input#email').type(user.email);
    cy.get('input#password').type(user.password);
    cy.get('input#confirmPassword').type(user.confirmPassword);
    cy.get('[data-testid="register-submit-button"]').click();

    cy.wait('@registerRequest').its('response.statusCode').should('eq', 201);
    cy.url().should('include', '/login');
  });

  it('muestra error de email duplicado del backend', () => {
    cy.intercept('POST', '**/auth/register').as('registerRequest');

    cy.get('input#name').type('Alice');
    cy.get('input#email').type('alice@ecommerce.com');
    cy.get('input#password').type('password123');
    cy.get('input#confirmPassword').type('password123');
    cy.get('[data-testid="register-submit-button"]').click();

    cy.wait('@registerRequest').its('response.statusCode').should('eq', 400);
    cy.get('[data-testid="field-error-email"]').should('contain.text', 'ya está registrado');
  });
});
