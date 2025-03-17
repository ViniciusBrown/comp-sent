/**
 * Store a JWT token in localStorage
 */
export function storeToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * Get the JWT token from localStorage
 */
export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Remove the JWT token from localStorage
 */
export function removeToken(): void {
  localStorage.removeItem('auth_token');
}
