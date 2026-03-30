import { useState } from 'react';
import { Layers, Search, PlusCircle, Power, Pencil, ChevronDown, ChevronRight } from 'lucide-react';
import { mockComposicoes, mockComposicaoVersoes } from '../infrastructure/mock/dados/composicoes.mock';
import { mockInsumos } from '../infrastructure/mock/dados/insumos.mock';
import { mockUnidades } from '../infrastructure/mock/dados/unidades.mock';
import { StatusBadgeNovo } from '../components/ui/StatusBadgeNovo';

export function Composicoes() {
  const [composicoes, setComposicoes] = useState(() => structuredClone(mockComposicoes));
  const [busca, setBusca] = useState('');
  const [filtroEspecialidade, setFiltroEspecialidade] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [expandida, setExpandida] = useState<string | null>(null);

  const insumoMap = Object.fromEntries(mockInsumos.map((i) => [i.id, i]));
  const unidadeMap = Object.fromEntries(mockUnidades.map((u) => [u.id, u]));

  const especialidades = [...new Set(mockComposicoes.map((c) => c.especialidade))].sort();

  const filtrados = composicoes.filter((c) => {
    const q = busca.toLowerCase();
    const matchBusca =
      !q ||
      c.titulo.toLowerCase().includes(q) ||
      c.codigo.toLowerCase().includes(q);
    const matchEsp =
      filtroEspecialidade === 'todos' || c.especialidade === filtroEspecialidade;
    const matchStatus =
      filtroStatus === 'todos' ||
      (filtroStatus === 'ativo' ? c.ativa : !c.ativa);
    return matchBusca && matchEsp && matchStatus;
  });

  function toggleAtiva(id: string) {
    setComposicoes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ativa: !c.ativa } : c))
    );
  }

  const selectCls =
    'border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700';

  const ESPECIALIDADE_LABELS: Record<string, string> = {
    eletrica: 'Elétrica',
    hidrossanitario: 'Hidrossanitário',
    civil: 'Civil',
    automacao: 'Automação',
    climatizacao: 'Climatização',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Composições</h1>
          <p className="text-sm text-slate-500 mt-1">
            Biblioteca de composições de serviços com versionamento.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm">
          <PlusCircle size={16} />
          Nova Composição
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
              placeholder="Buscar por código ou título..."
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
            <option value="ativo">Ativa</option>
            <option value="inativo">Inativa</option>
          </select>

          <span className="text-xs text-slate-400 ml-auto">
            {filtrados.length} composição{filtrados.length !== 1 ? 'ões' : ''}
          </span>
        </div>

        {filtrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20">
            <div className="bg-slate-100 rounded-2xl p-5 mb-4">
              <Layers size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Nenhuma composição encontrada</p>
            <p className="text-sm text-slate-400">
              {busca || filtroEspecialidade !== 'todos' || filtroStatus !== 'todos'
                ? 'Tente ajustar os filtros de busca.'
                : 'Clique em "Nova Composição" para cadastrar a primeira composição.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="w-8 px-4 py-3" />
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Código
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Título
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Especialidade
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Versão Atual
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((comp, idx) => {
                    const versao = mockComposicaoVersoes.find(
                      (v) => v.id === comp.versaoAtualId
                    );
                    const isExpanded = expandida === comp.id;

                    return (
                      <>
                        <tr
                          key={comp.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            !isExpanded && idx !== filtrados.length - 1
                              ? 'border-b border-slate-100'
                              : ''
                          }`}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() =>
                                setExpandida(isExpanded ? null : comp.id)
                              }
                              className="p-0.5 rounded text-slate-400 hover:text-slate-600 transition-colors"
                              title={isExpanded ? 'Recolher' : 'Ver insumos'}
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
                              status={comp.ativa ? 'ativo' : 'inativo'}
                              label={comp.ativa ? 'Ativa' : 'Inativa'}
                            />
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-xs text-slate-500">
                              {comp.codigo}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[300px]">
                            <p className="font-medium text-slate-800 truncate">
                              {comp.titulo}
                            </p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="bg-purple-50 text-purple-700 text-xs font-medium px-2.5 py-1 rounded-full">
                              {ESPECIALIDADE_LABELS[comp.especialidade] ?? comp.especialidade}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {versao ? (
                              <span className="text-xs text-slate-600">
                                v{versao.numeroVersao}
                                {' · '}
                                <span className="text-slate-400">{versao.unidade}</span>
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
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
                                title={comp.ativa ? 'Inativar' : 'Ativar'}
                                onClick={() => toggleAtiva(comp.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  comp.ativa
                                    ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                    : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                                }`}
                              >
                                <Power size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Linha expandida: insumos da versão atual */}
                        {isExpanded && versao && (
                          <tr
                            key={`${comp.id}-detail`}
                            className={`bg-slate-50 ${
                              idx !== filtrados.length - 1
                                ? 'border-b border-slate-100'
                                : ''
                            }`}
                          >
                            <td colSpan={7} className="px-8 py-4">
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                Insumos — versão {versao.numeroVersao}
                              </p>
                              {versao.insumos.length === 0 ? (
                                <p className="text-xs text-slate-400">
                                  Nenhum insumo cadastrado nesta versão.
                                </p>
                              ) : (
                                <table className="text-xs w-full max-w-xl">
                                  <thead>
                                    <tr className="text-slate-400">
                                      <th className="text-left pb-1 font-medium">Insumo</th>
                                      <th className="text-left pb-1 font-medium">Qtd</th>
                                      <th className="text-left pb-1 font-medium">Unidade</th>
                                      <th className="text-right pb-1 font-medium">Vlr. Unit.</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {versao.insumos.map((item) => {
                                      const ins = insumoMap[item.insumoId];
                                      const un = unidadeMap[item.unidadeId];
                                      return (
                                        <tr key={item.insumoId} className="text-slate-600">
                                          <td className="py-1">
                                            {ins
                                              ? `${ins.codigo} · ${ins.descricao}`
                                              : item.insumoId}
                                          </td>
                                          <td className="py-1">{item.quantidade}</td>
                                          <td className="py-1">
                                            {un?.simbolo ?? item.unidadeId}
                                          </td>
                                          <td className="py-1 text-right font-mono">
                                            {item.valorUnitario != null
                                              ? `R$ ${item.valorUnitario.toFixed(2)}`
                                              : '—'}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              )}
                              {versao.encargos && (
                                <p className="mt-2 text-xs text-slate-400">
                                  Encargos sociais:{' '}
                                  <span className="text-slate-600 font-medium">
                                    {versao.encargos.percentualTotal}%
                                  </span>
                                </p>
                              )}
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
