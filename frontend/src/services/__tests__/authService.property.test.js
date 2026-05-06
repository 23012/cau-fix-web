import * as fc from 'fast-check';
import { checkDuplicateId, register } from '../authService';

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn((url, options) => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: 'ok', available: true }),
    });
  });
});

describe('Property 1: register() 필드 매핑 정확성', () => {
  it('formData.id는 항상 login_id로 매핑된다', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1 }),
          password: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          role: fc.constantFrom('C', 'E'),
          dept: fc.string(),
          phone: fc.string(),
        }),
        async (formData) => {
          let capturedBody = null;
          global.fetch = jest.fn((url, options) => {
            capturedBody = JSON.parse(options.body);
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ message: 'ok', member: {} }),
            });
          });
          await register(formData);
          expect(capturedBody.login_id).toBe(formData.id);
          expect(capturedBody.password).toBe(formData.password);
          expect(capturedBody.name).toBe(formData.name);
          expect(capturedBody.role).toBe(formData.role);
          expect(capturedBody.dept).toBe(formData.dept);
          expect(capturedBody.phone).toBe(formData.phone);
          expect(capturedBody.id).toBeUndefined();
        }
      )
    );
  });
});

describe('Property 2: checkDuplicateId() URL 인코딩 정확성', () => {
  it('특수문자 포함 loginId가 올바르게 인코딩된다', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (loginId) => {
          let capturedUrl = '';
          global.fetch = jest.fn((url) => {
            capturedUrl = url;
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ available: true, message: 'ok' }),
            });
          });
          await checkDuplicateId(loginId);
          expect(capturedUrl).toContain(encodeURIComponent(loginId));
        }
      )
    );
  });
});
