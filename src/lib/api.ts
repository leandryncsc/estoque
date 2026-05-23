/**
 * Obter a URL base da API baseado no ambiente
 */
export const getApiUrl = (): string => {
  // Em produção (Vercel, etc)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin;
  }
  
  // Em desenvolvimento local
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  
  // Fallback
  return '/';
};

/**
 * Fazer requisição com URL correta
 */
export const apiCall = async (
  endpoint: string,
  options?: RequestInit
): Promise<Response> => {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}/api${endpoint}`;
  
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
};
