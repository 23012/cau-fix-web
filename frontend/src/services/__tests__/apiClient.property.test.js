import * as fc from 'fast-check';
import apiClient, { ApiError } from '../apiClient';

beforeEach(() => {
  localStorage.clear();
});

describe('Property 3: apiClient 토큰 자동 첨부', () => {
  it('localStorage에 token이 있으면 Authorization 헤더에 포함된다', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1 }),
        async (token) => {
          localStorage.setItem('token', token);
          let capturedHeaders = {};
          global.fetch = jest.fn((url, options) => {
            capturedHeaders = options.headers;
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({}),
            });
          });
          await apiClient('/test');
          expect(capturedHeaders.Authorization).toBe(`Bearer ${token}`);
        }
      )
    );
  });

  it('localStorage에 token이 없으면 Authorization 헤더가 없다', async () => {
    let capturedHeaders = {};
    global.fetch = jest.fn((url, options) => {
      capturedHeaders = options.headers;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
    await apiClient('/test');
    expect(capturedHeaders.Authorization).toBeUndefined();
  });
});

describe('Property 4: apiClient 에러 응답 추출', () => {
  it('4xx/5xx 응답 시 ApiError를 throw하며 status와 message를 포함한다', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }),
        fc.string({ minLength: 1 }),
        async (status, message) => {
          global.fetch = jest.fn(() =>
            Promise.resolve({
              ok: false,
              status,
              json: () => Promise.resolve({ message }),
            })
          );
          try {
            await apiClient('/test');
            throw new Error('should have thrown');
          } catch (err) {
            if (err.message === 'should have thrown') throw err;
            expect(err).toBeInstanceOf(ApiError);
            expect(err.status).toBe(status);
            expect(err.message).toBe(message);
          }
        }
      )
    );
  });

  it('에러 응답 바디 파싱 실패 시 기본 메시지 사용', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 400, max: 599 }),
        async (status) => {
          global.fetch = jest.fn(() =>
            Promise.resolve({
              ok: false,
              status,
              json: () => Promise.reject(new Error('parse error')),
            })
          );
          try {
            await apiClient('/test');
            throw new Error('should have thrown');
          } catch (err) {
            if (err.message === 'should have thrown') throw err;
            expect(err).toBeInstanceOf(ApiError);
            expect(err.status).toBe(status);
            expect(err.message).toBe('요청 처리 중 오류가 발생했습니다.');
          }
        }
      )
    );
  });
});
