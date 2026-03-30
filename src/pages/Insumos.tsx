import { useState } from 'react';
import { Package, Search, PlusCircle, Power, Pencil } from 'lucide-react';
import { mockInsumos } from '../infrastructure/mock/dados/insumos.mock';
import { mockCategorias } from '../infrastructure/mock/dados/categorias.mock';
import { mockUnidades } from '../infrastructure/mock/dados/unidades.mock';
import { StatusBadgeNovo } from '../components/ui/StatusBadgeNovo';

export function Insumos() {
  const [insumos, setInsumos] = useState(() => structuredClone(mockInsumos));
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');

  const categoriaMap = Object.fromEntries(mockCategorias.map((c) => [c.id, c]));
  const unidadeMap = Object.fromEntries(mockUnidades.map((u) => [u.id, u]));

  const filtrados = insumos.filter((ins) => {
    const q = busca.toLowerCase();
    const matchBusca =
      !q ||
      ins.descricao.toLowerCase().includes(q) ||
      ins.codigo.toLowerCase().includes(q);
    const matchCategoria =
      filtroCategoria === 'todos' || ins.categoriaId === filtroCategoria;
    const matchStatus =
      filtroStatus === 'todos' ||
      (filtroStatus === 'ativo' ? ins.ativo : !ins.ativo);
    return matchBusca && matchCategoria && matchStatus;
  });

  function toggleAtivo(id: string) {
    setInsumos((prev) =>
      prev.map((ins) => (ins.id === id ? { ...ins, ativo: !ins.ativo } : ins))
    );
  }

  const selectCls =
    'border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700';

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Insumos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Catálogo de materiais, serviços e equipamentos.
          </p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm">
          <PlusCircle size={16} />
          Novo Insumo
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
              placeholder="Buscar por código ou descrição..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className={selectCls}
          >
            <option value="todos">Todas as categorias</option>
            {mockCategorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
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
            {filtrados.length} insumo{filtrados.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filtrados.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-20">
            <div className="bg-slate-100 rounded-2xl p-5 mb-4">
              <Package size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Nenhum insumo encontrado</p>
            <p className="text-sm text-slate-400">
              {busca || filtroCategoria !== 'todos' || filtroStatus !== 'todos'
                ? 'Tente ajustar os filtros de busca.'
                : 'Clique em "Novo Insumo" para cadastrar o primeiro insumo.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Código
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Descrição
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Categoria
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Unidade
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((ins, idx) => {
                    const categoria = categoriaMap[ins.categoriaId];
                    const unidade = unidadeMap[ins.unidadeId];
                    return (
                      <tr
                        key={ins.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          idx !== filtrados.length - 1
                            ? 'border-b border-slate-100'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadgeNovo
                            status={ins.ativo ? 'ativo' : 'inativo'}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs text-slate-500">
                            {ins.codigo}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[300px]">
                          <p className="font-medium text-slate-800 truncate">
                            {ins.descricao}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {categoria ? (
                            <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                              {categoria.nome}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-slate-600">
                            {unidade
                              ? `${unidade.simbolo} · ${unidade.descricao}`
                              : <span className="text-slate-300">—</span>}
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
                              title={ins.ativo ? 'Inativar' : 'Ativar'}
                              onClick={() => toggleAtivo(ins.id)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                ins.ativo
                                  ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                                  : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                              }`}
                            >
                              <Power size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
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
