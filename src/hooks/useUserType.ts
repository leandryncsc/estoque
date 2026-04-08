import { useEffect, useState } from "react";

export function useUserType() {
  const [type, setType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchUserType() {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setType(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          // O backend retorna 'role' que pode ser 'administrador', 'vendedor' etc
          setType(userData.role);
        } else {
          setType(null);
          setUser(null);
          localStorage.removeItem('token');
        }
      } catch (err) {
        setType(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUserType();

    const handleAuthChange = () => fetchUserType();
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, []);

  return { type, loading, user };
}
