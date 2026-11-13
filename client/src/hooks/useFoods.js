/**
 * useFoods.js — ServeSync (Member 1, Commit 5)
 *
 * Custom hook that fetches food items from the backend Food API.
 *
 * Usage:
 *   const { foods, loading, error, refetch } = useFoods();
 *
 * Design decisions:
 *  - Each food document returned by the API has an `_id` (MongoDB ObjectId
 *    string) but the CartContext (Member 2) and MenuItemCard identify items
 *    by `item.id`. This hook normalises each document so that `id` === `_id`,
 *    keeping full compatibility with the existing cart implementation without
 *    touching CartContext.
 *  - The fetch is triggered once on mount. The `refetch` function lets callers
 *    manually re-request (e.g., after a network error).
 *  - An AbortController is used to cancel in-flight requests when the
 *    component unmounts, preventing state updates on unmounted components.
 *  - Only available items (isAvailable !== false) are still included in the
 *    returned array; MenuItemCard controls whether the Add to Cart button is
 *    enabled, and the page shows the full list so customers can see what's on
 *    the menu even when temporarily unavailable.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

/**
 * Normalises a raw food document from the API into the shape expected by
 * MenuItemCard and CartContext:
 *   - Adds `id` = `_id`  (CartContext key)
 *   - Ensures `price` is a number
 *   - Ensures boolean fields have proper defaults
 *
 * @param {object} doc  Raw document from GET /api/foods
 * @returns {object}
 */
function normaliseFood(doc) {
  return {
    ...doc,
    id: String(doc._id),          // CartContext uses item.id for deduplication
    // Ensure name and description are always strings — the search filter in
    // MenuPage calls .toLowerCase() on both, which throws if either is null/undefined.
    name: doc.name ? String(doc.name) : '',
    description: doc.description ? String(doc.description) : '',
    price: Number(doc.price),
    isVeg: doc.isVeg === true,
    isPopular: doc.isPopular === true,
    isAvailable: doc.isAvailable !== false, // treat missing as available
    image: doc.image || '',
  };
}

/**
 * useFoods — fetches all food items from GET /api/foods.
 *
 * @returns {{
 *   foods: object[],
 *   loading: boolean,
 *   error: string|null,
 *   refetch: () => void
 * }}
 */
export function useFoods() {
  const [foods, setFoods]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Track whether the component is still mounted to avoid state-on-unmounted
  const isMounted = useRef(true);

  const fetchFoods = useCallback(async (signal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/foods', { signal });
      const raw = response.data?.foods ?? [];

      if (isMounted.current) {
        setFoods(raw.map(normaliseFood));
        setError(null);
      }
    } catch (err) {
      // Ignore abort errors — they are intentional (component unmounted)
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      if (isMounted.current) {
        setError(err.message || 'Failed to load menu. Please try again.');
        setFoods([]);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Ref to the AbortController so refetch can cancel the previous request
  const abortRef = useRef(null);

  const refetch = useCallback(() => {
    // Cancel any in-flight request before starting a new one
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    fetchFoods(controller.signal);
  }, [fetchFoods]);

  useEffect(() => {
    isMounted.current = true;

    const controller = new AbortController();
    abortRef.current = controller;
    fetchFoods(controller.signal);

    return () => {
      isMounted.current = false;
      controller.abort();
    };
  }, [fetchFoods]);

  return { foods, loading, error, refetch };
}
