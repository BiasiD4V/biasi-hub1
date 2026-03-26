import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Orcamento } from '../types';
import { orcamentosRepository, type OrcamentoSupabase } from '../infrastructure/supabase/orcamentosRepository';

interface OrcamentosContextType {
  orcamentos: Orcamento[];
  addOrcamento: (orc: Orcamento) => Promise<void>;
  atualizarOrcamento: (id: string, dados: Partial<Orcamento>) => Promise<void>;
  deletarOrcamento: (id: string) => Promise<void>;
  carregando: boolean;
  erro: string | null;
}

const OrcamentosContext = createContext<OrcamentosContextType | null>(null);

// Função para mapear dados do Supabase para o tipo local
function mapearOrcamentoSupabase(orc: OrcamentoSupabase): Orcamento {
  return {
    id: orc.id,
    numero: orc.numero,
    cliente: {
      id: orc.cliente_id || '',
      nome: orc.clientes?.nome || 'Cliente não informado',
      email: orc.clientes?.cidade || '',
      telefone: orc.clientes?.estado || '',
    },
    itens: [],
    status: (orc.status as any) || 'rascunho',
    dataCriacao: orc.criado_em,
    observacoes: orc.objeto || '',
  };
}

export function OrcamentosProvider({ children }: { children: ReactNode }) {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Carregar orçamentos do Supabase na montagem
  useEffect(() => {
    async function carregarOrcamentos() {
      try {
        setCarregando(true);
        setErro(null);
        const dados = await orcamentosRepository.listarTodos();
        const orcamentosMapeados = dados.map(mapearOrcamentoSupabase);
        setOrcamentos(orcamentosMapeados);
      } catch (err) {
        const mensagem = err instanceof Error ? err.message : 'Erro ao carregar orçamentos';
        setErro(mensagem);
        console.error('Erro ao carregar orçamentos:', err);
      } finally {
        setCarregando(false);
      }
    }

    carregarOrcamentos();
  }, []);

  async function addOrcamento(orc: Orcamento) {
    try {
      setErro(null);
      const novoOrcamento = await orcamentosRepository.criar({
        numero: orc.numero,
        cliente_id: orc.cliente.id,
        nome_obra: orc.cliente.nome,
        objeto: orc.observacoes,
        status: orc.status,
      });
      const mapeado = mapearOrcamentoSupabase(novoOrcamento);
      setOrcamentos((prev) => [mapeado, ...prev]);
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao adicionar orçamento';
      setErro(mensagem);
      console.error('Erro ao adicionar orçamento:', err);
      throw err;
    }
  }

  async function atualizarOrcamento(id: string, dados: Partial<Orcamento>) {
    try {
      setErro(null);
      await orcamentosRepository.atualizar(id, {
        numero: dados.numero,
        status: dados.status,
        objeto: dados.observacoes,
      });
      setOrcamentos((prev) =>
        prev.map((orc) =>
          orc.id === id ? { ...orc, ...dados } : orc
        )
      );
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao atualizar orçamento';
      setErro(mensagem);
      console.error('Erro ao atualizar orçamento:', err);
      throw err;
    }
  }

  async function deletarOrcamento(id: string) {
    try {
      setErro(null);
      await orcamentosRepository.deletar(id);
      setOrcamentos((prev) => prev.filter((orc) => orc.id !== id));
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao deletar orçamento';
      setErro(mensagem);
      console.error('Erro ao deletar orçamento:', err);
      throw err;
    }
  }

  return (
    <OrcamentosContext.Provider
      value={{
        orcamentos,
        addOrcamento,
        atualizarOrcamento,
        deletarOrcamento,
        carregando,
        erro,
      }}
    >
      {children}
    </OrcamentosContext.Provider>
  );
}

export function useOrcamentos() {
  const ctx = useContext(OrcamentosContext);
  if (!ctx) throw new Error('useOrcamentos must be used within OrcamentosProvider');
  return ctx;
}
