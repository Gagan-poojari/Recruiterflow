import { test, expect } from '@playwright/test';

const BASE_URL = 'https://reqres.in';
const API_KEY = process.env.REQRES_API_KEY;

test.describe('ReqRes API User Endpoints', () => {
  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (API_KEY) {
      headers['x-api-key'] = API_KEY;
    }
    return headers;
  };

  test('4. GET /api/users/2 returns status 200 and data.email', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/users/2`, {
      headers: getHeaders(),
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data).toBeDefined();
    expect(body.data.email).toBeDefined();
    expect(typeof body.data.email).toBe('string');
    expect(body.data.email).toContain('@');
  });

  test('5. POST /api/users creates a new user with status 201', async ({ request }) => {
    const payload = {
      name: 'morpheus',
      job: 'leader',
    };

    const response = await request.post(`${BASE_URL}/api/users`, {
      data: payload,
      headers: getHeaders(),
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.name).toBe('morpheus');
    expect(body.job).toBe('leader');
    expect(body.id).toBeDefined();
    expect(body.createdAt).toBeDefined();
  });

  test('bonus: GET /api/users/23 returns 404 not found', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/users/23`, {
      headers: getHeaders(),
    });

    expect(response.status()).toBe(404);
  });
});
