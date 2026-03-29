import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health', () => {
    it('/api/v1/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
        });
    });
  });

  describe('Auth', () => {
    const testUser = {
      email: `test-${Date.now()}@example.com`,
      password: 'Test123456',
      name: 'Test',
      surname: 'User',
    };
    let accessToken: string;

    it('/api/v1/auth/register (POST) - should register', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
          expect(res.body).toHaveProperty('success', true);
        });
    });

    it('/api/v1/auth/login (POST) - should login', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
          expect(res.body.data).toHaveProperty('accessToken');
          accessToken = res.body.data.accessToken;
        });
    });

    it('/api/v1/auth/login (POST) - wrong password should fail', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('/api/v1/auth/me (GET) - should return user with token', async () => {
      if (!accessToken) return;
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('email', testUser.email);
        });
    });
  });

  describe('Products', () => {
    it('/api/v1/products/search (GET) - should return products', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products/search')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('/api/v1/products/featured (GET) - should return featured products', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products/featured')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
        });
    });
  });

  describe('Stores', () => {
    it('/api/v1/stores/search (GET) - should return stores', () => {
      return request(app.getHttpServer())
        .get('/api/v1/stores/search')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('Search', () => {
    it('/api/v1/search?q=test (GET) - should return search results', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search?q=test')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
        });
    });

    it('/api/v1/search/suggest?q=t (GET) - should return suggestions', () => {
      return request(app.getHttpServer())
        .get('/api/v1/search/suggest?q=t')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
        });
    });
  });
});
