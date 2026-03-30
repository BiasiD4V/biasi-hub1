import { useState } from 'react';
import { FileText, Search, PlusCircle, Power, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import { mockTemplates, mockTemplateVersoes } from '../infrastructure/mock/dados/templates.mock';
import { StatusBadgeNovo } from '../components/ui/StatusBadgeNovo';

export function Templates() {
  const [templates, setTemplates] = useState(() => structuredClone(mockTemplates));
  const [busca, setBusca] = useState('');
  const [filtroEspecialidade, setFiltroEspecialidade] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [expandido, setExpandido] = useState<string | null>(null);

  const especialidades = [...new Set(mockTemplates.map((t) => t.especialidade))].sort();

  const ESPECIALIDADE_LABELS: Record<string, string> = {
    eletrica: 'Elétrica',
    hidrossanitario: 'Hidrossanitário',
    civil: 'Civil',
    automacao: 'Automação',
    climatizacao: 'Climatização',
  };

  const filtrados = templates.filter((t) => {
    const q = busca.toLowerCase();
    const matchBusca = !q || t.nome.toLowerCase().includes(q);
    const matchEsp =
      filtroEspecialidade === 'todos' || t.especialidade === filtroEspecialidade;
    const matchStatus =
      filtroStatus === 'todos' ||
      (filtroStatus === 'ativo' ? t.ativa : !t.ativa);
    return matchBusca && matchEsp && matchStatus;
  });

  function toggleAtiva(id: string) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ativa: !t.ativa } : t))
    );
  }

  const selectCls =
    'border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700';

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Templates</h1>
          <p className="text-sm text-slate-500 mt-1">
            Estruturas reutilizáveis de orçamentos por tipologia.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm">
          <PlusCircle size={16} />
          Novo Template
        </button>
      </div>

      {/* Corpo */}
      <div className="flex-1 p-8 overflow-auto">
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
              placeholder="Buscar por nome..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filtroEspecialidade}
            onChange={(e) => setFiltroEspecialidade(e.target.value)}
            className={selectCls}
          >
            <option value="todos">Todas as especialidades</option>
            {especialidades.map((e) => (
              <option key={e} value={e}>
                {ESPECIALIDADE_LABELS[e] ?? e}
              </option>
            ))}
          </select>

          <select
            value={filtroStatus}
            onChange={(e) =>
              setFiltroStatus(e.target.value as 'todos' | 'ativo' | 'inativo')
            }
            className={selectCls}
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>

          <span className="text-xs text-slate-400 ml-auto">
            {filtrados.length} template{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20">
            <div className="bg-slate-100 rounded-2xl p-5 mb-4">
              <FileText size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Nenhum template encontrado</p>
            <p className="text-sm text-slate-400">
              {busca || filtroEspecialidade !== 'todos' || filtroStatus !== 'todos'
                ? 'Tente ajustar os filtros de busca.'
                : 'Clique em "Novo Template" para criar o primeiro template.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="w-8 px-4 py-3" />
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Nome
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Especialidade
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Versão Atual
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Criado em
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((tmpl, idx) => {
                    const versao = mockTemplateVersoes.find(
                      (v) => v.id === tmpl.versaoAtualId
                    );
                    const isExpanded = expandido === tmpl.id;

                    return (
                      <>
                        <tr
                          key={tmpl.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            !isExpanded && idx !== filtrados.length - 1
                              ? 'border-b border-slate-100'
                              : ''
                          }`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() =>
                                setExpandido(isExpanded ? null : tmpl.id)
                              }
                              className="p-0.5 rounded text-slate-400 hover:text-slate-600 transition-colors"
                              title={isExpanded ? 'Recolher' : 'Ver estrutura'}
                            >
                              {isExpanded ? (
                                <ChevronDown size={14} />
                              ) : (
                                <ChevronRight size={14} />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadgeNovo
                              status={tmpl.ativa ? 'ativo' : 'inativo'}
                            />
                          </td>
                          <td className="px-4 py-3 max-w-[280px]">
                            <p className="font-medium text-slate-800 truncate">
                              {tmpl.nome}
                            </p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
                              {ESPECIALIDADE_LABELS[tmpl.especialidade] ??
                                tmpl.especialidade}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {versao ? (
                              <span className="text-xs text-slate-600">
                                v{versao.numeroVersao}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-xs text-slate-500">
                              {tmpl.criadaEm
                                ? new Date(tmpl.criadaEm).toLocaleDateString('pt-BR')
                                : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button
                                title="Editar"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                title={tmpl.ativa ? 'Inativar' : 'Ativar'}
                                onClick={() => toggleAtiva(tmpl.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  tmpl.ativa
                                    ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                    : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                                }`}
                              >
                                <Power size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Linha expandida: estrutura de disciplinas/etapas/ambientes */}
                        {isExpanded && versao && (
                          <tr
                            key={`${tmpl.id}-detail`}
                            className={`bg-slate-50 ${
                              idx !== filtrados.length - 1
                                ? 'border-b border-slate-100'
                                : ''
                            }`}
                          >
                            <td colSpan={7} className="px-8 py-4">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                Estrutura — versão {versao.numeroVersao}
                              </p>
                              <div className="space-y-3">
                                {versao.estrutura.disciplinas.map((disc) => (
                                  <div key={disc.nome}>
                                    <p className="text-xs font-semibold text-slate-700 mb-1">
                                      {disc.nome}
                                    </p>
                                    <div className="pl-3 space-y-1">
                                      {disc.etapas.map((etapa) => (
                                        <div key={etapa.nome}>
                                          <p className="text-xs text-slate-500 mb-0.5">
                                            Etapa: <span className="font-medium text-slate-600">{etapa.nome}</span>
                                          </p>
                                          <p className="text-xs text-slate-400 pl-3">
                                            Ambientes: {etapa.ambientes.join(', ')}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
