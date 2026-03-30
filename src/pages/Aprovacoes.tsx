import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Search,
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { useNovoOrcamento } from '../context/NovoOrcamentoContext';
import { StatusBadgeNovo } from '../components/ui/StatusBadgeNovo';

export function Aprovacoes() {
  const navigate = useNavigate();
  const { orcamentos } = useNovoOrcamento();
  const [busca, setBusca] = useState('');
  const [filtroResponsavel, setFiltroResponsavel] = useState('todos');

  // Orçamentos que aguardam aprovação
  const aguardando = orcamentos.filter(
    (o) => o.status === 'aguardando_aprovacao'
  );

  const responsaveis = [
    ...new Set(aguardando.map((o) => o.responsavel).filter(Boolean)),
  ].sort();

  const filtrados = aguardando.filter((o) => {
    const q = busca.toLowerCase();
    const matchBusca =
      !q ||
      o.titulo.toLowerCase().includes(q) ||
      o.numero.toLowerCase().includes(q) ||
      o.clienteNome.toLowerCase().includes(q);
    const matchResp =
      filtroResponsavel === 'todos' || o.responsavel === filtroResponsavel;
    return matchBusca && matchResp;
  });

  const selectCls =
    'border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700';

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Aprovações</h1>
          <p className="text-sm text-slate-500 mt-1">
            Fila de revisões aguardando aprovação.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-orange-50 text-orange-700 text-sm font-medium px-4 py-2 rounded-lg">
          <Clock size={16} />
          {aguardando.length} aguardando
        </div>
      </div>

      {/* Corpo */}
      <div className="flex-1 p-8 overflow-auto">
        {aguardando.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20">
            <div className="bg-green-50 rounded-2xl p-5 mb-4">
              <CheckCircle size={32} className="text-green-500" />
            </div>
            <p className="text-slate-600 font-medium mb-1">
              Nenhuma aprovação pendente
            </p>
            <p className="text-sm text-slate-400">
              Todas as revisões foram avaliadas. Ótimo trabalho!
            </p>
          </div>
        ) : (
          <>
            {/* Filtros */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <div className="relative flex-1 min-w-[240px] max-w-sm">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por número, título ou cliente..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={filtroResponsavel}
                onChange={(e) => setFiltroResponsavel(e.target.value)}
                className={selectCls}
              >
                <option value="todos">Todos os responsáveis</option>
                {responsaveis.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <span className="text-xs text-slate-400 ml-auto">
                {filtrados.length} revisão{filtrados.length !== 1 ? 'ões' : ''}
              </span>
            </div>

            {filtrados.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-16">
                <p className="text-slate-600 font-medium mb-1">
                  Nenhuma revisão encontrada
                </p>
                <p className="text-sm text-slate-400">
                  Tente ajustar os filtros de busca.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtrados.map((orc) => (
                  <div
                    key={orc.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4"
                  >
                    {/* Ícone de status */}
                    <div className="bg-orange-50 rounded-xl p-2.5 flex-shrink-0">
                      <CheckSquare size={20} className="text-orange-500" />
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-xs text-slate-400">
                              {orc.numero}
                            </span>
                            <StatusBadgeNovo status={orc.status} />
                          </div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {orc.titulo}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {orc.clienteNome}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-slate-400">Responsável</p>
                          <p className="text-sm font-medium text-slate-700">
                            {orc.responsavel || '—'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(orc.criadoEm).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>

                      {orc.tiposObraNomes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {orc.tiposObraNomes.map((tipo) => (
                            <span
                              key={tipo}
                              className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full"
                            >
                              {tipo}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        title="Ver orçamento"
                        onClick={() => navigate(`/orcamentos/${orc.id}`)}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button
                        title="Aprovar"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <CheckCircle size={14} />
                        Aprovar
                      </button>
                      <button
                        title="Reprovar"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <XCircle size={14} />
                        Reprovar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
