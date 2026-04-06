import {
  Search, RefreshCw, LayoutGrid, List, XCircle, Plus,
  Calendar, GanttChart,
} from 'lucide-react';
import type { JiraIssue } from './biraTypes';

// ── Props ─────────────────────────────────────────────────────────────────────
export interface BiraFiltrosProps {
  issues: JiraIssue[];
  filtrados: JiraIssue[];
  busca: string;
  setBusca: (v: string) => void;
  filtroStatus: string;
  setFiltroStatus: (v: string) => void;
  filtroTipo: string;
  setFiltroTipo: (v: string) => void;
  filtroResponsavel: string;
  setFiltroResponsavel: (v: string) => void;
  aba: 'quadro' | 'lista' | 'calendario' | 'cronograma';
  setAba: (v: 'quadro' | 'lista' | 'calendario' | 'cronograma') => void;
  allStatuses: string[];
  allTipos: string[];
  responsaveis: string[];
  stats: {
    total: number;
    ideia: number;
    afazer: number;
    andamento: number;
    analise: number;
    concluido: number;
  };
  lastSync: Date | null;
  syncing: boolean;
  onRefresh: () => void;
  onShowCreate: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function BiraFiltros({
  filtrados,
  busca, setBusca,
  filtroStatus, setFiltroStatus,
  filtroTipo, setFiltroTipo,
  filtroResponsavel, setFiltroResponsavel,
  aba, setAba,
  allStatuses, allTipos, responsaveis,
  stats,
  lastSync, syncing,
  onRefresh, onShowCreate,
}: BiraFiltrosProps) {
  return (
    <>
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-800">Time comercial — Tarefas</h1>
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">ORC</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">biasiengenharia-comercial.atlassian.net</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastSync && (
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                {syncing && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                Sync {lastSync.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button onClick={onRefresh} className={`flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 rounded-lg transition-colors ${syncing ? 'animate-pulse' : ''}`}>
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} /> Atualizar
            </button>
            <button
              onClick={onShowCreate}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus size={14} /> Criar
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 flex-wrap mb-4">
          {[
            { label: 'Total', value: stats.total, cls: 'bg-slate-50 border-slate-200 text-slate-700' },
            { label: 'Ideia', value: stats.ideia, cls: 'bg-slate-50 border-slate-200 text-slate-600' },
            { label: 'A Fazer', value: stats.afazer, cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
            { label: 'Em Andamento', value: stats.andamento, cls: 'bg-blue-50 border-blue-200 text-blue-700' },
            { label: 'Em Análise', value: stats.analise, cls: 'bg-amber-50 border-amber-200 text-amber-700' },
            { label: 'Concluído', value: stats.concluido, cls: 'bg-green-50 border-green-200 text-green-700' },
          ].map(s => (
            <div key={s.label} className={`border rounded-xl px-3 py-2 ${s.cls}`}>
              <p className="text-[10px] opacity-70">{s.label}</p>
              <p className="text-lg font-bold leading-none">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-slate-200 -mb-[17px]">
          {([['quadro', 'Quadro', LayoutGrid], ['lista', 'Lista', List], ['calendario', 'Calendário', Calendar], ['cronograma', 'Cronograma', GanttChart]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setAba(id)}
              className={`flex items-center gap-1.5 pb-3 text-sm font-medium border-b-2 transition-colors ${aba === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center gap-3 flex-wrap flex-shrink-0">
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg px-3 py-1.5 flex-1 min-w-[180px] max-w-sm">
          <Search size={13} className="text-slate-400 flex-shrink-0" />
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar ticket, resumo..." className="bg-transparent text-sm flex-1 outline-none placeholder:text-slate-400" />
        </div>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white">
          <option value="">Todos os status</option>
          {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white">
          <option value="">Todos os tipos</option>
          {allTipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filtroResponsavel} onChange={e => setFiltroResponsavel(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 bg-white">
          <option value="">Todos responsáveis</option>
          {responsaveis.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {(busca || filtroStatus || filtroTipo || filtroResponsavel) && (
          <button onClick={() => { setBusca(''); setFiltroStatus(''); setFiltroTipo(''); setFiltroResponsavel(''); }}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
            <XCircle size={13} /> Limpar
          </button>
        )}
        <span className="ml-auto text-xs text-slate-400 flex-shrink-0">{filtrados.length} issues</span>
      </div>
    </>
  );
}
