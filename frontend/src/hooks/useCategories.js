import { useState, useEffect } from "react";
import { getCategories, getCategoriesWithTotal } from "../services/categoryService";

/**
 * 카테고리 목록을 API에서 가져오는 훅
 * @param {boolean} includeTotal - true면 "전체" 포함 (처리자 가입용)
 * @returns {{ categories: Array, loading: boolean, error: string|null }}
 */
export default function useCategories(includeTotal = false) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = includeTotal
          ? await getCategoriesWithTotal()
          : await getCategories();
        setCategories(result.categories);
      } catch (err) {
        setError(err.message || "카테고리를 불러올 수 없습니다");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [includeTotal]);

  return { categories, loading, error };
}
