import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function useAuth() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;

      try {
        const { data } = await axios.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        return data.user;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      localStorage.removeItem('auth_token');
    },
    onSuccess: () => {
      queryClient.setQueryData(['me'], null);
    },
  });
}