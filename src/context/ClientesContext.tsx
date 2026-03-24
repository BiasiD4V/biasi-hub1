import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Cliente } from '../domain/entities/Cliente';
import { mockClientes } from '../infrastructure/mock/dados/clientes.mock';

export type CriarClienteInput = Omit<Cliente, 'id' | 'criadoEm'>;
export type EditarClienteInput = Partial<Omit<Cliente, 'id' | 'criadoEm'>>;

interface ClientesContextType {
  clientes: Cliente[];
  criarCliente: (input: CriarClienteInput) => string;
  editarCliente: (id: string, input: EditarClienteInput) => void;
  toggleAtivoCliente: (id: string) => void;
  buscarCliente: (id: string) => Cliente | null;
}

const ClientesContext = createContext<ClientesContextType | null>(null);

export function ClientesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(() =>
    structuredClone(mockClientes)
  );

  function criarCliente(input: CriarClienteInput): string {
    const id = `cli-${Date.now()}`;
    const novo: Cliente = {
      ...input,
      id,
      criadoEm: new Date().toISOString(),
    };
    setClientes((prev) => [novo, ...prev]);
    return id;
  }

  function editarCliente(id: string, input: EditarClienteInput): void {
    setClientes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...input } : c))
    );
  }

  function toggleAtivoCliente(id: string): void {
    setClientes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c))
    );
  }

  function buscarCliente(id: string): Cliente | null {
    return clientes.find((c) => c.id === id) ?? null;
  }

  return (
    <ClientesContext.Provider
      value={{
        clientes,
        criarCliente,
        editarCliente,
        toggleAtivoCliente,
        buscarCliente,
      }}
    >
      {children}
    </ClientesContext.Provider>
  );
}

export function useClientes() {
  const ctx = useContext(ClientesContext);
  if (!ctx) throw new Error('useClientes must be used within ClientesProvider');
  return ctx;
}
