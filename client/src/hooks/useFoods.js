
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

function normaliseFood(doc) {
  return {
    ...doc,
    id: String(doc._id),
    name: doc.name ? String(doc.name) : '',
    description: doc.description ? String(doc.description) : '',
    price: Number(doc.price),
    isVeg: doc.isVeg === true,
    isPopular: doc.isPopular === true,
    isAvailable: doc.isAvailable !== false,
    image: doc.image || '',
  };
}

export function useFoods() {
  const [foods, setFoods]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

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

  const abortRef = useRef(null);

  const refetch = useCallback(() => {
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
