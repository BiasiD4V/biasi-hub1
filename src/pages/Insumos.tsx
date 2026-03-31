import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Filter,
  Clock,
  Truck,
  Ruler,
  CalendarDays,
  CircleDollarSign,
  RotateCcw,
  ChevronDown,
  Hash,
  BarChart3,
} from 'lucide-react';
import {
  insumosRepository,
  type Insumo,
  type InsumoHistorico,
  type FiltrosInsumos,
} from '../infrastructure/supabase/insumosRepository';

/* ═══════════════════ Helpers ═══════════════════ */

const FMT_BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const FMT_DATE = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

const UNIDADE_LABELS: Record<string, string> = {
  BR: 'Barra', CX: 'Caixa', GL: 'Galão', KG: 'Quilograma',
  M: 'Metro', 'M³': 'Metro Cúbico', PÇ: 'Peça', RL: 'Rolo', VB: 'Verba',
};

function badgeAlerta(dias: number | null) {
  if (dias === null || dias === undefined) return <span className="text-slate-300">—</span>;
  if (dias >= 365) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
      <AlertTriangle size={11} /> {Math.floor(dias / 365)}a {Math.floor((dias % 365) / 30)}m
    </span>
  );
  if (dias >= 180) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-100">
      <AlertTriangle size={11} /> {dias}d
    </span>
  );
  if (dias >= 90) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
      <Clock size={11} /> {dias}d
    </span>
  );
  if (dias >= 30) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-50 text-slate-500 border border-slate-100">
      {dias}d
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-green-50 text-green-600 border border-green-100">
      {dias}d
    </span>
  );
}

function badgeUnidade(unidade: string) {
  const colors: Record<string, string> = {
    M: 'bg-blue-50 text-blue-700 border-blue-200',
    'M³': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    KG: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    PÇ: 'bg-slate-100 text-slate-600 border-slate-200',
    CX: 'bg-amber-50 text-amber-700 border-amber-200',
    RL: 'bg-purple-50 text-purple-700 border-purple-200',
    GL: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    BR: 'bg-orange-50 text-orange-700 border-orange-200',
    VB: 'bg-pink-50 text-pink-700 border-pink-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${colors[unidade] || 'bg-slate-100 text-slate-600 border-slate-200'}`}
      title={UNIDADE_LABELS[unidade] || unidade}
    >
      {unidade}
    </span>
  );
}

/* ═══════════════════ Card KPI ═══════════════════ */

function CardKPI({ icon: Icon, iconBg, iconColor, label, value, valueColor = 'text-slate-800', subtitle }: {
  icon: typeof Package;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  valueColor?: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow p-5 flex items-center gap-4">
      <div className={`${iconBg} rounded-xl p-3 shrink-0`}>
        <Icon size={22} className={iconColor} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">{label}</p>
        <p className={`text-2xl font-bold ${valueColor} leading-tight mt-0.5`}>{value}</p>
        {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════ Modal Histórico ═══════════════════ */

function ModalHistorico({ insumo, onFechar }: { insumo: Insumo; onFechar: () => void }) {
  const [historico, setHistorico] = useState<InsumoHistorico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    insumosRepository.listarHistorico(insumo.id).then(setHistorico).finally(() => setLoading(false));
  }, [insumo.id]);

  const variacao = useMemo(() => {
    if (historico.length < 2) return null;
    const ultimo = historico[0]?.custo ?? 0;
    const anterior = historico[1]?.custo ?? 0;
    if (anterior === 0) return null;
    return ((ultimo - anterior) / anterior) * 100;
  }, [historico]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onFechar} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 mr-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-white/20 rounded-lg p-1.5">
                  <History size={16} />
                </div>
                <span className="text-sm font-medium text-blue-100">Histórico de Preços</span>
              </div>
              <h3 className="font-bold text-lg leading-snug line-clamp-2">{insumo.descricao}</h3>
              {insumo.fornecedor && (
                <p className="text-blue-200 text-sm mt-1 flex items-center gap-1.5">
                  <Truck size={13} /> {insumo.fornecedor}
                </p>
              )}
            </div>
            <button onClick={onFechar} className="bg-white/10 hover:bg-white/20 rounded-lg p-1.5 transition-colors shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Resumo cards */}
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl px-4 py-3 border border-slate-100">
            <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Custo Atual</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{FMT_BRL.format(insumo.custo_atual)}</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 border border-slate-100">
            <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Unidade</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{insumo.unidade}</p>
            <p className="text-[10px] text-slate-400">{UNIDADE_LABELS[insumo.unidade] || ''}</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 border border-slate-100">
            <p className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Variação</p>
            {variacao !== null ? (
              <p className={`text-lg font-bold mt-0.5 flex items-center gap-1 ${variacao > 0 ? 'text-red-600' : variacao < 0 ? 'text-green-600' : 'text-slate-500'}`}>
                {variacao > 0 ? <TrendingUp size={16} /> : variacao < 0 ? <TrendingDown size={16} /> : <Minus size={16} />}
                {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
              </p>
            ) : (
              <p className="text-lg font-bold text-slate-300 mt-0.5">—</p>
            )}
            <p className="text-[10px] text-slate-400">{historico.length} registro{historico.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Tabela do histórico */}
        <div className="overflow-auto max-h-[45vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600" />
              <p className="text-sm text-slate-400">Carregando histórico...</p>
            </div>
          ) : historico.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <div className="bg-slate-100 rounded-2xl p-4">
                <History size={28} className="text-slate-300" />
              </div>
              <p className="text-slate-500 font-medium">Sem registros</p>
              <p className="text-xs text-slate-400">Nenhuma cotação anterior encontrada.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50/80 sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Data</th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Custo</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fornecedor</th>
                  <th className="text-center px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Variação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historico.map((h, idx) => {
                  const anterior = historico[idx + 1]?.custo;
                  let varNode: React.ReactNode = <span className="text-slate-300">—</span>;
                  if (anterior && anterior > 0) {
                    const pct = ((h.custo - anterior) / anterior) * 100;
                    const cls = pct > 0 ? 'text-red-600 bg-red-50' : pct < 0 ? 'text-green-600 bg-green-50' : 'text-slate-500 bg-slate-50';
                    varNode = (
                      <span className={`${cls} px-2 py-0.5 rounded-md text-xs font-semibold`}>
                        {pct > 0 ? '+' : ''}{pct.toFixed(1)}%
                      </span>
                    );
                  }
                  return (
                    <tr key={h.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-5 py-3 text-sm text-slate-700 font-medium">
                        {h.data_cotacao ? FMT_DATE.format(new Date(h.data_cotacao)) : '—'}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-800 font-bold text-right tabular-nums">
                        {FMT_BRL.format(h.custo)}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-500">{h.fornecedor || '—'}</td>
                      <td className="px-5 py-3 text-center">{varNode}</td>
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

/* ═══════════════════ Página Principal ═══════════════════ */

const POR_PAGINA = 50;

export function Insumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [filtroFornecedor, setFiltroFornecedor] = useState('');
  const [filtroUnidade, setFiltroUnidade] = useState('');
  const [filtroAlerta, setFiltroAlerta] = useState('');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const [fornecedores, setFornecedores] = useState<string[]>([]);
  const [unidades, setUnidades] = useState<string[]>([]);
  const [insumoHistorico, setInsumoHistorico] = useState<Insumo | null>(null);
  const [resumo, setResumo] = useState({ total: 0, alertas90: 0, alertas180: 0, fornecedores: 0 });

  // Debounce busca (300ms)
  useEffect(() => {
    const t = setTimeout(() => setBuscaDebounced(busca), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const filtros: FiltrosInsumos = {};
      if (buscaDebounced) filtros.busca = buscaDebounced;
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
  }, [pagina, buscaDebounced, filtroFornecedor, filtroUnidade, filtroAlerta]);

  useEffect(() => { carregar(); }, [carregar]);

  useEffect(() => {
    insumosRepository.listarFornecedores().then((f) => {
      setFornecedores(f);
      setResumo((prev) => ({ ...prev, fornecedores: f.length }));
    }).catch(console.error);
    insumosRepository.listarUnidades().then(setUnidades).catch(console.error);

    Promise.all([
      insumosRepository.listar(0, {}),
      insumosRepository.listar(0, { alertaDias: 90 }),
      insumosRepository.listar(0, { alertaDias: 180 }),
    ]).then(([all, a90, a180]) => {
      setResumo((prev) => ({ ...prev, total: all.total, alertas90: a90.total, alertas180: a180.total }));
    }).catch(console.error);
  }, []);

  useEffect(() => { setPagina(0); }, [buscaDebounced, filtroFornecedor, filtroUnidade, filtroAlerta]);

  const totalPaginas = Math.ceil(total / POR_PAGINA);
  const filtrosAtivos = [filtroFornecedor, filtroUnidade, filtroAlerta].filter(Boolean).length;
  const inicio = pagina * POR_PAGINA + 1;
  const fim = Math.min((pagina + 1) * POR_PAGINA, total);

  return (
    <div className="space-y-5 pb-8">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-2.5 shadow-lg shadow-blue-500/20">
              <Package size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 leading-tight">Catálogo de Insumos</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                Base de materiais com {resumo.fornecedores} fornecedores e histórico de preços
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Cards KPI ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <CardKPI
          icon={Package}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          label="Total de Insumos"
          value={resumo.total.toLocaleString('pt-BR')}
          subtitle={`${resumo.fornecedores} fornecedores`}
        />
        <CardKPI
          icon={Truck}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          label="Fornecedores"
          value={resumo.fornecedores}
          valueColor="text-indigo-700"
          subtitle="Empresas cadastradas"
        />
        <CardKPI
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
          label="+90 dias sem preço"
          value={resumo.alertas90.toLocaleString('pt-BR')}
          valueColor="text-amber-600"
          subtitle="Precisam atualização"
        />
        <CardKPI
          icon={AlertTriangle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          label="+180 dias sem preço"
          value={resumo.alertas180.toLocaleString('pt-BR')}
          valueColor="text-red-600"
          subtitle="Atenção urgente"
        />
      </div>

      {/* ═══ Barra de Busca + Filtros ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Busca principal */}
        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por descrição, fornecedor ou código..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-300 transition-all placeholder:text-slate-400"
            />
            {busca && (
              <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setFiltrosAbertos(!filtrosAbertos)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all shrink-0 ${
              filtrosAtivos > 0
                ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Filter size={15} />
            Filtros
            {filtrosAtivos > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {filtrosAtivos}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${filtrosAbertos ? 'rotate-180' : ''}`} />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 shrink-0 pl-2 border-l border-slate-200">
            <BarChart3 size={13} />
            {total.toLocaleString('pt-BR')} item{total !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Filtros expandíveis */}
        {filtrosAbertos && (
          <div className="px-4 pb-4 pt-0 border-t border-slate-100">
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 min-w-[200px]">
                <Truck size={14} className="text-slate-400 shrink-0" />
                <select
                  value={filtroFornecedor}
                  onChange={(e) => setFiltroFornecedor(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
                >
                  <option value="">Todos os fornecedores</option>
                  {fornecedores.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Ruler size={14} className="text-slate-400 shrink-0" />
                <select
                  value={filtroUnidade}
                  onChange={(e) => setFiltroUnidade(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
                >
                  <option value="">Todas unidades</option>
                  {unidades.map((u) => <option key={u} value={u}>{u} — {UNIDADE_LABELS[u] || u}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-slate-400 shrink-0" />
                <select
                  value={filtroAlerta}
                  onChange={(e) => setFiltroAlerta(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
                >
                  <option value="">Qualquer período</option>
                  <option value="30">+30 dias sem atualizar</option>
                  <option value="90">+90 dias sem atualizar</option>
                  <option value="180">+180 dias sem atualizar</option>
                  <option value="365">+1 ano sem atualizar</option>
                </select>
              </div>

              {filtrosAtivos > 0 && (
                <button
                  onClick={() => { setFiltroFornecedor(''); setFiltroUnidade(''); setFiltroAlerta(''); }}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <RotateCcw size={12} /> Limpar filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Tabela ═══ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-blue-100 border-t-blue-600" />
            <p className="text-sm text-slate-400">Carregando insumos...</p>
          </div>
        ) : insumos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="bg-slate-100 rounded-2xl p-6 mb-4">
              <Package size={36} className="text-slate-300" />
            </div>
            <p className="text-slate-600 font-semibold mb-1">Nenhum insumo encontrado</p>
            <p className="text-sm text-slate-400 max-w-xs text-center">Tente ajustar os filtros de busca ou verifique a importação de dados.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                    <th className="text-left pl-5 pr-3 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-[40%]">
                      <span className="flex items-center gap-1.5"><Hash size={12} /> Descrição</span>
                    </th>
                    <th className="text-left px-3 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><Truck size={12} /> Fornecedor</span>
                    </th>
                    <th className="text-center px-3 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-16">
                      <span className="flex items-center justify-center gap-1"><Ruler size={11} /> Un.</span>
                    </th>
                    <th className="text-right px-3 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-32">
                      <span className="flex items-center justify-end gap-1"><CircleDollarSign size={12} /> Custo</span>
                    </th>
                    <th className="text-center px-3 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-28">
                      <span className="flex items-center justify-center gap-1"><CalendarDays size={11} /> Atualiz.</span>
                    </th>
                    <th className="text-center px-3 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-24">
                      Status
                    </th>
                    <th className="text-center pr-5 pl-3 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider w-14">
                      <History size={12} className="mx-auto" />
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {insumos.map((ins) => (
                    <tr key={ins.id} className="group hover:bg-blue-50/40 transition-colors">
                      <td className="pl-5 pr-3 py-3.5">
                        <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-1 group-hover:text-blue-700 transition-colors">
                          {ins.descricao}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{ins.codigo}</p>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className="text-sm text-slate-600 line-clamp-1">{ins.fornecedor || '—'}</span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {badgeUnidade(ins.unidade)}
                      </td>
                      <td className="px-3 py-3.5 text-right">
                        <span className="text-sm font-bold text-slate-800 tabular-nums">
                          {FMT_BRL.format(ins.custo_atual)}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="text-xs text-slate-500">
                          {ins.data_ultimo_preco ? FMT_DATE.format(new Date(ins.data_ultimo_preco)) : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {badgeAlerta(ins.dias_sem_atualizar)}
                      </td>
                      <td className="pr-5 pl-3 py-3.5 text-center">
                        <button
                          onClick={() => setInsumoHistorico(ins)}
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-100 transition-all group-hover:text-blue-500"
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

            {/* Paginação elegante */}
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Mostrando <span className="font-semibold text-slate-700">{inicio}</span> a{' '}
                <span className="font-semibold text-slate-700">{fim}</span> de{' '}
                <span className="font-semibold text-slate-700">{total.toLocaleString('pt-BR')}</span> insumos
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagina(0)}
                  disabled={pagina === 0}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Primeira
                </button>
                <button
                  onClick={() => setPagina((p) => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                  className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200 bg-white"
                >
                  <ChevronLeft size={16} className="text-slate-600" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let pg: number;
                    if (totalPaginas <= 5) pg = i;
                    else if (pagina < 3) pg = i;
                    else if (pagina > totalPaginas - 4) pg = totalPaginas - 5 + i;
                    else pg = pagina - 2 + i;
                    return (
                      <button
                        key={pg}
                        onClick={() => setPagina(pg)}
                        className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-all ${
                          pg === pagina
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {pg + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPagina((p) => Math.min(totalPaginas - 1, p + 1))}
                  disabled={pagina >= totalPaginas - 1}
                  className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200 bg-white"
                >
                  <ChevronRight size={16} className="text-slate-600" />
                </button>
                <button
                  onClick={() => setPagina(totalPaginas - 1)}
                  disabled={pagina >= totalPaginas - 1}
                  className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Última
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══ Modal Histórico ═══ */}
      {insumoHistorico && (
        <ModalHistorico insumo={insumoHistorico} onFechar={() => setInsumoHistorico(null)} />
      )}
    </div>
  );
}
