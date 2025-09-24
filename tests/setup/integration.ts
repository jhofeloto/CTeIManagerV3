// CODECTI Platform - Integration Tests Setup

import { Hono } from 'hono';
import { createMockEnv } from './database';

// Create a test app with mocked environment
export function createTestApp() {
  const mockEnv = createMockEnv();
  
  // Create app with mock environment injected
  const app = new Hono<{ Bindings: typeof mockEnv }>();
  
  // Middleware to inject mock environment
  app.use('*', async (c, next) => {
    // Inject mock environment
    c.env = mockEnv as any;
    await next();
  });
  
  return app;
}

// Helper to create authenticated request
export async function createAuthenticatedRequest(app: Hono, role: 'admin' | 'collaborator' = 'admin') {
  const email = role === 'admin' ? 'admin@codecti.choco.gov.co' : 'investigador1@codecti.choco.gov.co';
  
  const loginResponse = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'password123'
    })
  });
  
  if (loginResponse.status !== 200) {
    throw new Error(`Login failed with status ${loginResponse.status}`);
  }
  
  const loginData = await loginResponse.json();
  return loginData.token;
}

// Helper to make authenticated requests
export function createAuthHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}