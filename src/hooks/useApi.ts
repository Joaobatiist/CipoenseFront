import { useCallback, useState } from 'react';

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | undefined>;
  reset: () => void;
}

export const useApi = <T = any>(
  apiFunction: (...args: any[]) => Promise<{ data: T }>
): UseApiReturn<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (...args: any[]): Promise<T | undefined> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiFunction(...args);
      const result = response.data;
      
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro na API:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};
