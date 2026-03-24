import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Usuario } from '../domain/entities/Usuario';

const USUARIO_MOCK: Usuario = {
  id: 'u3',
  nome: 'Paulo Confar',
  email: 'paulo@biasi.com.br',
  papel: 'orcamentista',
  ativo: true,
};

interface AuthContextType {
  isAuthenticated: boolean;
  usuario: Usuario | null;
  login: (email: string, senha: string) => Promise<{ sucesso: boolean; erro?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    try {
      const stored = sessionStorage.getItem('orcabiasi_usuario');
      return stored ? (JSON.parse(stored) as Usuario) : null;
    } catch {
      return null;
    }
  });

  async function login(
    email: string,
    senha: string
  ): Promise<{ sucesso: boolean; erro?: string }> {
    if (!email.trim() || !senha.trim()) {
      return { sucesso: false, erro: 'Preencha e-mail e senha.' };
    }
    await new Promise<void>((r) => setTimeout(r, 500));
    sessionStorage.setItem('orcabiasi_usuario', JSON.stringify(USUARIO_MOCK));
    setUsuario(USUARIO_MOCK);
    return { sucesso: true };
  }

  function logout() {
    sessionStorage.removeItem('orcabiasi_usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!usuario, usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
