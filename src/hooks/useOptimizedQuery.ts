
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

export const useOptimizedQuery = <T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  });
};
