import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Search, FileText, LayoutGrid, List } from 'lucide-react';
import { useNovoOrcamento } from '../context/NovoOrcamentoContext';
import { ModalNovoOrcamento } from '../components/orcamentos/ModalNovoOrcamento';
import { StatusBadgeNovo } from '../components/ui/StatusBadgeNovo';
import { KanbanFunil } from '../components/orcamentos/KanbanFunil';
import { AlertasOrcamento } from '../components/orcamentos/AlertasOrcamento';
import type { StatusRevisao } from '../domain/value-objects/StatusRevisao';
import { ETAPA_LABELS, ETAPA_CORES } from '../domain/value-objects/EtapaFunil';
import { RESULTADO_LABELS, RESULTADO_CORES } from '../domain/value-objects/ResultadoComercial';
import { NIVEL_AMAB_LABELS, NIVEL_AMAB_CORES } from '../domain/value-objects/QualificacaoOportunidade';
import { calcularPrioridade, PRIORIDADE_CONFIG } from '../utils/prioridade';

function formatarDataCurta(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function isDataPassada(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr + 'T23:59:59') < new Date();
}

export function OrcamentosNovos() {
  const navigate = useNavigate();
  const { orcamentos } = useNovoOrcamento();
  const [modalAberto, setModalAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [visualizacao, setVisualizacao] = useState<'lista' | 'kanban'>('lista');

  const filtrados = orcamentos.filter(
    (o) =>
      o.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      o.numero.toLowerCase().includes(busca.toLowerCase()) ||
      o.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
      o.responsavel.toLowerCase().includes(busca.toLowerCase())
  );

  function handleCriado(id: string) {
    setModalAberto(false);
    navigate(`/orcamentos/${id}`);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Orçamentos</h1>
          <p className="text-sm text-slate-500 mt-1">
            {orcamentos.length} orçamento{orcamentos.length !== 1 ? 's' : ''} no total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Toggle visualização */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setVisualizacao('lista')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                visualizacao === 'lista'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List size={14} />
              Lista
            </button>
            <button
              onClick={() => setVisualizacao('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                visualizacao === 'kanban'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid size={14} />
              Kanban
            </button>
          </div>

          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            Novo Orçamento
          </button>
        </div>
      </div>

      {/* Corpo */}
      <div className={`flex-1 p-8 ${visualizacao === 'kanban' ? 'overflow-hidden flex flex-col' : 'overflow-auto'}`}>
        {/* Busca */}
        <div className="mb-6 relative max-w-sm flex-shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título, número, cliente..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Kanban */}
        {visualizacao === 'kanban' && (
          <div className="flex-1 overflow-auto">
            <KanbanFunil orcamentos={filtrados} />
          </div>
        )}

        {/* Lista */}
        {visualizacao === 'lista' && (
          <>
            {filtrados.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20">
                <div className="bg-slate-100 rounded-2xl p-5 mb-4">
                  <FileText size={32} className="text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium mb-1">Nenhum orçamento encontrado</p>
                <p className="text-sm text-slate-400">
                  {busca ? 'Tente outros termos de busca.' : 'Clique em "Novo Orçamento" para começar.'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[1080px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          Prior.
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          Número
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Título
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          Cliente
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          Etapa
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          Responsável
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                          Próxima ação
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          Data próx.
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          Última interact.
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          Alertas
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          Qualif.
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          Resultado
                        </th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map((orc, idx) => {
                        const dataVencida = isDataPassada(orc.dataProximaAcao) && !!orc.proximaAcao;
                        const corEtapa = ETAPA_CORES[orc.etapaFunil];
                        const prioridade = calcularPrioridade(orc);
                        const priCfg = prioridade ? PRIORIDADE_CONFIG[prioridade] : null;
                        return (
                          <tr
                            key={orc.id}
                            onClick={() => navigate(`/orcamentos/${orc.id}`)}
                            className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                              idx !== filtrados.length - 1 ? 'border-b border-slate-100' : ''
                            } ${
                              orc.resultadoComercial === 'ganho'
                                ? 'border-l-4 border-l-green-400'
                                : orc.resultadoComercial === 'perdido'
                                ? 'border-l-4 border-l-red-400'
                                : prioridade === 'alta'
                                ? 'border-l-4 border-l-red-300'
                                : prioridade === 'media'
                                ? 'border-l-4 border-l-amber-300'
                                : 'border-l-4 border-l-transparent'
                            }`}
                          >
                            {/* Prioridade */}
                            <td className="px-3 py-3 whitespace-nowrap">
                              {priCfg ? (
                                <span
                                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${priCfg.bg} ${priCfg.text}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${priCfg.dot}`} />
                                  {priCfg.label}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>

                            {/* Número */}
                            <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                              {orc.numero}
                            </td>

                            {/* Título */}
                            <td className="px-4 py-3 font-medium text-slate-800 max-w-[180px]">
                              <span className="block truncate">{orc.titulo}</span>
                            </td>

                            {/* Cliente */}
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                              {orc.clienteNome}
                            </td>

                            {/* Etapa */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${corEtapa.bg} ${corEtapa.text}`}
                              >
                                {ETAPA_LABELS[orc.etapaFunil]}
                              </span>
                            </td>

                            {/* Responsável */}
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                              {orc.responsavel || '—'}
                            </td>

                            {/* Próxima ação */}
                            <td className="px-4 py-3 max-w-[160px]">
                              <span
                                className={`block truncate text-xs ${
                                  orc.proximaAcao ? 'text-slate-700' : 'text-slate-400'
                                }`}
                              >
                                {orc.proximaAcao || '—'}
                              </span>
                            </td>

                            {/* Data próxima ação */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {orc.dataProximaAcao ? (
                                <span
                                  className={`text-xs font-medium ${
                                    dataVencida ? 'text-red-500' : 'text-slate-500'
                                  }`}
                                >
                                  {new Date(orc.dataProximaAcao + 'T12:00:00').toLocaleDateString('pt-BR')}
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>

                            {/* Última interação */}
                            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                              {formatarDataCurta(orc.ultimaInteracao)}
                            </td>

                            {/* Alertas */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <AlertasOrcamento orc={orc} compact />
                            </td>

                            {/* Qualificação resumida: chance + urgência */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {orc.chanceFechamento || orc.urgencia ? (
                                <div className="flex flex-col gap-0.5">
                                  {orc.chanceFechamento && (
                                    <span
                                      className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${NIVEL_AMAB_CORES[orc.chanceFechamento]}`}
                                    >
                                      C: {NIVEL_AMAB_LABELS[orc.chanceFechamento]}
                                    </span>
                                  )}
                                  {orc.urgencia && (
                                    <span
                                      className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${NIVEL_AMAB_CORES[orc.urgencia]}`}
                                    >
                                      U: {NIVEL_AMAB_LABELS[orc.urgencia]}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-300">—</span>
                              )}
                            </td>

                            {/* Resultado comercial */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {(() => {
                                const cor = RESULTADO_CORES[orc.resultadoComercial];
                                return (
                                  <span
                                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${cor.bg} ${cor.text}`}
                                  >
                                    {RESULTADO_LABELS[orc.resultadoComercial]}
                                  </span>
                                );
                              })()}
                            </td>

                            {/* Status técnico */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <StatusBadgeNovo
                                status={orc.status as StatusRevisao | 'rascunho'}
                                label={orc.statusLabel}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <ModalNovoOrcamento
        aberto={modalAberto}
        onFechar={() => setModalAberto(false)}
        onCriado={handleCriado}
      />
    </div>
  );
}
