export function uniqueEmail(prefix = 'cypress') {
  return `${prefix}-${Date.now()}@test.com`;
}

export function newUser(email) {
  return {
    name: 'Usuario Test',
    email,
    password: 'Test1234!',
    confirmPassword: 'Test1234!',
  };
}
