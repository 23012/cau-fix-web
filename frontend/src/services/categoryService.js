import apiClient from './apiClient';

/**
 * 카테고리 목록 조회 (민원 등록용 - 전체 제외)
 * @returns {Promise<{categories: Array<{category_id: number, category_name: string, dept: string}>}>}
 */
export async function getCategories() {
  return apiClient('/categories');
}

/**
 * 카테고리 목록 조회 (처리자 가입용 - 전체 포함)
 * @returns {Promise<{categories: Array<{category_id: number, category_name: string, dept: string|null}>}>}
 */
export async function getCategoriesWithTotal() {
  return apiClient('/categories/with-total');
}
