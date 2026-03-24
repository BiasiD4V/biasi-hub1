import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Orcamento } from '../types';
import { mockPrototipoOrcamentos } from '../infrastructure/mock/dados/prototipo.mock';

interface OrcamentosContextType {
  orcamentos: Orcamento[];
  addOrcamento: (orc: Orcamento) => void;
}

const OrcamentosContext = createContext<OrcamentosContextType | null>(null);

export function OrcamentosProvider({ children }: { children: ReactNode }) {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(mockPrototipoOrcamentos);

  function addOrcamento(orc: Orcamento) {
    setOrcamentos((prev) => [orc, ...prev]);
  }

  return (
    <OrcamentosContext.Provider value={{ orcamentos, addOrcamento }}>
      {children}
    </OrcamentosContext.Provider>
  );
}

export function useOrcamentos() {
  const ctx = useContext(OrcamentosContext);
  if (!ctx) throw new Error('useOrcamentos must be used within OrcamentosProvider');
  return ctx;
}
