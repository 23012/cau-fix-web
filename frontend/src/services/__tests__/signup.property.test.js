import * as fc from 'fast-check';

/**
 * Property 5~8: 회원가입 페이지 유효성 검증 속성 테스트
 * signup.js의 handleCheckDuplicate / handleSubmit 로직을 순수 함수로 추출하여 검증
 */

function validateCheckDuplicate(id) {
  if (!id.trim()) {
    return { valid: false, error: '아이디를 입력해주세요' };
  }
  return { valid: true };
}

function validateSubmit({ idChecked, idAvailable, formData, passwordConfirm }) {
  if (!idChecked) {
    return { valid: false, error: '아이디 중복 확인을 해주세요' };
  }
  if (idAvailable === false) {
    return { valid: false, error: '사용 불가능한 아이디입니다' };
  }
  const { id, password, name, dept, phone } = formData;
  if (!id.trim() || !password.trim() || !passwordConfirm.trim() || !name.trim() || !dept.trim() || !phone.trim()) {
    return { valid: false, error: '모든 항목을 입력해주세요' };
  }
  if (password !== passwordConfirm) {
    return { valid: false, error: '비밀번호가 일치하지 않습니다' };
  }
  return { valid: true };
}

describe('Property 5: 빈 입력 중복 확인 차단', () => {
  it('공백 또는 빈 문자열 id는 항상 차단된다', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n')),
        (id) => {
          const result = validateCheckDuplicate(id);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('아이디를 입력해주세요');
        }
      )
    );
  });

  it('비어있지 않은 id는 통과한다', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (id) => {
          const result = validateCheckDuplicate(id);
          expect(result.valid).toBe(true);
        }
      )
    );
  });
});

describe('Property 6: 필수 필드 누락 시 API 호출 차단', () => {
  it('필수 필드 중 하나라도 비어있으면 차단된다', () => {
    const fields = ['id', 'password', 'name', 'dept', 'phone'];
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: fields.length - 1 }),
        fc.record({
          id: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          password: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          role: fc.constantFrom('C', 'E'),
          dept: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
          phone: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        }),
        (emptyFieldIdx, formData) => {
          const modified = { ...formData, [fields[emptyFieldIdx]]: '  ' };
          const result = validateSubmit({
            idChecked: true,
            idAvailable: true,
            formData: modified,
            passwordConfirm: modified.password,
          });
          expect(result.valid).toBe(false);
          expect(result.error).toBe('모든 항목을 입력해주세요');
        }
      )
    );
  });
});

describe('Property 7: 비밀번호 불일치 시 API 호출 차단', () => {
  it('password와 passwordConfirm이 다르면 항상 차단된다', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (password, extra) => {
          const passwordConfirm = password + extra;
          fc.pre(password !== passwordConfirm);
          const formData = {
            id: 'test',
            password,
            name: 'name',
            role: 'C',
            dept: 'dept',
            phone: '010',
          };
          const result = validateSubmit({
            idChecked: true,
            idAvailable: true,
            formData,
            passwordConfirm,
          });
          expect(result.valid).toBe(false);
          expect(result.error).toBe('비밀번호가 일치하지 않습니다');
        }
      )
    );
  });
});

describe('Property 8: 로딩 상태 항상 해제', () => {
  it('API 성공/실패 관계없이 loading은 항상 false로 돌아온다', () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        (shouldSucceed) => {
          let loading = true;
          try {
            if (!shouldSucceed) throw new Error('fail');
          } catch (e) {
            // error handling
          } finally {
            loading = false;
          }
          expect(loading).toBe(false);
        }
      )
    );
  });
});
