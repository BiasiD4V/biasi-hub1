import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  DollarSign,
  Filter,
} from 'lucide-react';
import {
  insumosRepository,
  type Insumo,
  type InsumoHistorico,
  type FiltrosInsumos,
} from '../infrastructure/supabase/insumosRepository';

/* ── Helpers ─────────────────────────────────────────────── */

const FMT_BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const FMT_DATE = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const selectCls =
  'border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700';

function corAlerta(dias: number | null) {
  if (dias === null) return null;
  if (dias >= 180) return 'text-red-600 bg-red-50';
  if (dias >= 90) return 'text-amber-600 bg-amber-50';
  return null;
}

function badgeAlerta(dias: number | null) {
  const cls = corAlerta(dias);
  if (!cls) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      <AlertTriangle size={12} />
      {dias}d
    </span>
  );
}

/* ── Modal Histórico ─────────────────────────────────────── */

function ModalHistorico({
  insumo,
  onFechar,
}: {
  insumo: Insumo;
  onFechar: () => void;
}) {
  const [historico, setHistorico] = useState<InsumoHistorico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insumosRepository
      .listarHistorico(insumo.id)
      .then(setHistorico)
      .finally(() => setLoading(false));
  }, [insumo.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <History size={18} className="text-blue-600" /> Histórico de Preços
            </h3>
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{insumo.descricao}</p>
            {insumo.fornecedor && (
              <p className="text-xs text-slate-400">{insumo.fornecedor}</p>
            )}
          </div>
          <button onClick={onFechar} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Resumo */}
        <div className="px-6 py-3 bg-slate-50 flex items-center gap-6 text-sm">
          <div>
            <span className="text-slate-500">Atual:</span>{' '}
            <span className="font-semibold text-slate-800">{FMT_BRL.format(insumo.custo_atual)}</span>
          </div>
          <div>
            <span className="text-slate-500">Unidade:</span>{' '}
            <span className="font-medium text-slate-700">{insumo.unidade}</span>
          </div>
          {historico.length >= 2 && (
            <div>
              <span className="text-slate-500">Variação:</span>{' '}
              {(() => {
                const ultimo = historico[0]?.custo ?? 0;
                const anterior = historico[1]?.custo ?? 0;
                if (anterior === 0) return <span className="text-slate-400">—</span>;
                const pct = ((ultimo - anterior) / anterior) * 100;
                const Icon = pct > 0 ? TrendingUp : pct < 0 ? TrendingDown : Minus;
                const color = pct > 0 ? 'text-red-600' : pct < 0 ? 'text-green-600' : 'text-slate-500';
                return (
                  <span className={`font-medium ${color} inline-flex items-center gap-1`}>
                    <Icon size={14} /> {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                  </span>
                );
              })()}
            </div>
          )}
          <div className="ml-auto text-xs text-slate-400">{historico.length} registros</div>
        </div>

        {/* Tabela */}
        <div className="overflow-auto max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            </div>
          ) : historico.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Nenhum registro de histórico encontrado.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-6 py-2.5 text-xs font-semibold text-slate-500 uppercase">Data</th>
                  <th className="text-right px-6 py-2.5 text-xs font-semibold text-slate-500 uppercase">Custo</th>
                  <th className="text-left px-6 py-2.5 text-xs font-semibold text-slate-500 uppercase">Fornecedor</th>
                  <th className="text-left px-6 py-2.5 text-xs font-semibold text-slate-500 uppercase">Origem</th>
                  <th className="text-center px-6 py-2.5 text-xs font-semibold text-slate-500 uppercase">Var.</th>
                </tr>
              </thead>
              <tbody>
                {historico.map((h, idx) => {
                  const anterior = historico[idx + 1]?.custo;
                  let variacao: React.ReactNode = '—';
                  if (anterior && anterior > 0) {
                    const pct = ((h.custo - anterior) / anterior) * 100;
                    const color = pct > 0 ? 'text-red-600' : pct < 0 ? 'text-green-600' : 'text-slate-500';
                    variacao = (
                      <span className={`${color} font-medium`}>
                        {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                      </span>
                    );
                  }
                  return (
                    <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-2.5 text-sm text-slate-700">
                        {h.data_cotacao ? FMT_DATE.format(new Date(h.data_cotacao)) : '—'}
                      </td>
                      <td className="px-6 py-2.5 text-sm text-slate-800 font-medium text-right">
                        {FMT_BRL.format(h.custo)}
                      </td>
                      <td className="px-6 py-2.5 text-sm text-slate-600">{h.fornecedor || '—'}</td>
                      <td className="px-6 py-2.5 text-xs text-slate-400">{h.origem}</td>
                      <td className="px-6 py-2.5 text-sm text-center">{variacao}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Página Principal ────────────────────────────────────── */

export function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroFornecedor, setFiltroFornecedor] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroAlerta, setFiltroAlerta] = useState('');

  // Listas de filtro
  const [fornecedores, setFornecedores] = useState<string[]>([]);
  const [unidades, setUnidades] = useState<string[]>([]);

  // Modal
  const [insumoHistorico, setInsumoHistorico] = useState<Insumo | null>(null);

  // Resumos
  const [resumo, setResumo] = useState({ total: 0, alertas90: 0, alertas180: 0 });

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const filtros: FiltrosInsumos = {};
      if (busca) filtros.busca = busca;
      if (filtroFornecedor) filtros.fornecedor = filtroFornecedor;
      if (filtroUnidade) filtros.unidade = filtroUnidade;
      if (filtroAlerta) filtros.alertaDias = Number(filtroAlerta);

      const result = await insumosRepository.listar(pagina, filtros);
      setInsumos(result.data);
      setTotal(result.total);
    } catch (err) {
      console.error('Erro ao carregar insumos:', err);
    } finally {
      setLoading(false);
    }
  }, [pagina, busca, filtroFornecedor, filtroUnidade, filtroAlerta]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Carregar filtros e resumo apenas uma vez
  useEffect(() => {
    insumosRepository.listarFornecedores().then(setFornecedores).catch(console.error);
    insumosRepository.listarUnidades().then(setUnidades).catch(console.error);

    // Resumo de alertas
    Promise.all([
      insumosRepository.listar(0, {}),
      insumosRepository.listar(0, { alertaDias: 90 }),
      insumosRepository.listar(0, { alertaDias: 180 }),
    ]).then(([all, a90, a180]) => {
      setResumo({ total: all.total, alertas90: a90.total, alertas180: a180.total });
    }).catch(console.error);
  }, []);

  // Reset página ao mudar filtros
  useEffect(() => {
    setPagina(0);
  }, [busca, filtroFornecedor, filtroUnidade, filtroAlerta]);

  const totalPaginas = Math.ceil(total / 50);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="bg-blue-100 rounded-xl p-2">
              <Package size={24} className="text-blue-600" />
            </div>
            Insumos
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Catálogo de materiais com histórico de preços e alertas de atualização
          </p>
        </div>
      </div>

      {/* ── Cards Resumo ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
          <div className="bg-blue-50 rounded-xl p-3">
            <Package size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Total de Insumos</p>
            <p className="text-2xl font-bold text-slate-800">{resumo.total.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
          <div className="bg-amber-50 rounded-xl p-3">
            <AlertTriangle size={22} className="text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">+90 dias sem atualizar</p>
            <p className="text-2xl font-bold text-amber-600">{resumo.alertas90.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center gap-4">
          <div className="bg-red-50 rounded-xl p-3">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">+180 dias sem atualizar</p>
            <p className="text-2xl font-bold text-red-600">{resumo.alertas180.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Busca */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar descrição, fornecedor ou código..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fornecedor */}
          <select value={filtroFornecedor} onChange={(e) => setFiltroFornecedor(e.target.value)} className={selectCls}>
            <option value="">Todos fornecedores</option>
            {fornecedores.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>

          {/* Unidade */}
          <select value={filtroUnidade} onChange={(e) => setFiltroUnidade(e.target.value)} className={selectCls}>
            <option value="">Todas unidades</option>
            {unidades.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>

          {/* Alerta */}
          <select value={filtroAlerta} onChange={(e) => setFiltroAlerta(e.target.value)} className={selectCls}>
            <option value="">Todos alertas</option>
            <option value="90">+90 dias</option>
            <option value="180">+180 dias</option>
            <option value="365">+1 ano</option>
          </select>

          {/* Limpar */}
          {(busca || filtroFornecedor || filtroUnidade || filtroAlerta) && (
            <button
              onClick={() => { setBusca(''); setFiltroFornecedor(''); setFiltroUnidade(''); setFiltroAlerta(''); }}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Filter size={12} /> Limpar
            </button>
          )}

          <span className="text-xs text-slate-400 ml-auto">
            {total.toLocaleString('pt-BR')} resultado{total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Tabela ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : insumos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-slate-100 rounded-2xl p-5 mb-4">
              <Package size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-1">Nenhum insumo encontrado</p>
            <p className="text-sm text-slate-400">Ajuste os filtros ou importe a base de dados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Descrição</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fornecedor</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unid.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Custo Atual</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Último Preço</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Alerta</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-16">Hist.</th>
                </tr>
              </thead>
              <tbody>
                {insumos.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{ins.descricao}</p>
                      <p className="text-xs text-slate-400">{ins.codigo}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{ins.fornecedor || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 text-center">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-xs font-medium">{ins.unidade}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 text-right">
                      <span className="inline-flex items-center gap-1">
                        <DollarSign size={13} className="text-slate-400" />
                        {FMT_BRL.format(ins.custo_atual)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 text-center">
                      {ins.data_ultimo_preco ? FMT_DATE.format(new Date(ins.data_ultimo_preco)) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {badgeAlerta(ins.dias_sem_atualizar)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setInsumoHistorico(ins)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Ver histórico de preços"
                      >
                        <History size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-500">
              Página {pagina + 1} de {totalPaginas}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina((p) => Math.max(0, p - 1))}
                disabled={pagina === 0}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                disabled={pagina >= totalPaginas - 1}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Histórico ── */}
      {insumoHistorico && (
        <ModalHistorico insumo={insumoHistorico} onFechar={() => setInsumoHistorico(null)} />
      )}
    </div>
  );
}
