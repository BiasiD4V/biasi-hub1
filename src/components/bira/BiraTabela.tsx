import { useState, useMemo, useEffect, useRef } from 'react';
import {
  ExternalLink, Plus, ChevronDown, ChevronRight, CheckSquare,
} from 'lucide-react';
import type { JiraIssue } from './biraTypes';
import { fetchAutenticado } from '../../utils/fetchAutenticado';
import {
  TRANSITIONS, COLUNAS_QUADRO, ISSUE_TYPE_ICON,
  PRIORITY_CLS, PRIORITY_ICON,
  statusCls, statusDot, formatDate,
} from './biraTypes';

// ── StatusDropdown (internal, reused in table rows) ───────────────────────────
function StatusDropdown({ current, onSelect, disabled }: {
  current: string; onSelect: (t: typeof TRANSITIONS[0]) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} className="relative inline-block">
      <button
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-opacity ${statusCls(current)} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${statusDot(current)}`} />
        {current}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-44 py-1 overflow-hidden">
          {TRANSITIONS.map(t => (
            <button
              key={t.id}
              onClick={() => { onSelect(t); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 transition-colors ${t.name === current ? 'font-semibold' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(t.name)}`} />
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Props ─────────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export interface BiraTabelaProps {
  filtrados: JiraIssue[];
  aba: 'quadro' | 'lista' | 'calendario' | 'cronograma';
  onOpenPanel: (issue: JiraIssue) => void;
  onStatusChange: (key: string, t: typeof TRANSITIONS[0]) => void;
  onDuedateChange: (key: string, newDate: string | null) => void;
  onShowCreate: () => void;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── BiraTabela (top-level switch) ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

export function BiraTabela({
  filtrados, aba, onOpenPanel, onStatusChange, onDuedateChange, onShowCreate,
}: BiraTabelaProps) {
  return (
    <div className="flex-1 overflow-auto">
      {aba === 'lista' && (
        <ListaHierarquica issues={filtrados} onOpenPanel={onOpenPanel} onStatusChange={onStatusChange} />
      )}
      {aba === 'calendario' && (
        <CalendarioView issues={filtrados} onOpenPanel={onOpenPanel} onDuedateChange={onDuedateChange} />
      )}
      {aba === 'cronograma' && (
        <CronogramaView issues={filtrados} onOpenPanel={onOpenPanel} />
      )}
      {aba === 'quadro' && (
        <QuadroView issues={filtrados} onOpenPanel={onOpenPanel} onStatusChange={onStatusChange} onShowCreate={onShowCreate} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Lista Hierárquica (pai -> filho -> subtask, 3 níveis) ─────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function ListaHierarquica({ issues, onOpenPanel, onStatusChange }: {
  issues: JiraIssue[];
  onOpenPanel: (i: JiraIssue) => void;
  onStatusChange: (key: string, t: typeof TRANSITIONS[0]) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(issues.filter(i => !i.parentKey).map(i => i.key)));

  const issueMap = useMemo(() => {
    const m: Record<string, JiraIssue> = {};
    issues.forEach(i => { m[i.key] = i; });
    return m;
  }, [issues]);

  const childMap = useMemo(() => {
    const map: Record<string, JiraIssue[]> = {};
    issues.forEach(i => {
      if (i.parentKey) {
        if (!map[i.parentKey]) map[i.parentKey] = [];
        map[i.parentKey].push(i);
      }
    });
    return map;
  }, [issues]);

  const roots = useMemo(() => {
    function findRoot(key: string, visited: Set<string>): string | null {
      const issue = issueMap[key];
      if (!issue) return null;
      if (!issue.parentKey) return key;
      if (visited.has(issue.parentKey)) return key;
      if (!issueMap[issue.parentKey]) return key;
      visited.add(issue.parentKey);
      return findRoot(issue.parentKey, visited);
    }
    const rootKeys = new Set<string>();
    issues.forEach(i => {
      const r = findRoot(i.key, new Set());
      if (r) rootKeys.add(r);
    });
    return issues.filter(i => rootKeys.has(i.key) && !i.parentKey)
      .concat(issues.filter(i => rootKeys.has(i.key) && i.parentKey && !issueMap[i.parentKey]));
  }, [issues, issueMap]);

  function toggle(key: string) {
    setExpanded(prev => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  }

  const DEPTH_COLORS = ['text-violet-600', 'text-blue-600', 'text-cyan-600', 'text-slate-500'];
  const DEPTH_BG = ['', 'bg-blue-50/20', 'bg-violet-50/20', 'bg-slate-50/20'];
  const DEPTH_BORDER = ['border-l-violet-400', 'border-l-blue-400', 'border-l-cyan-400', 'border-l-slate-300'];

  function IssueRow({ issue, depth }: { issue: JiraIssue; depth: number }) {
    const children = childMap[issue.key] || [];
    const hasChildren = children.length > 0;
    const isOpen = expanded.has(issue.key);
    const TypeIcon = ISSUE_TYPE_ICON[issue.issuetype] || CheckSquare;
    const isConcluido = issue.status === 'Concluído';
    const depthColor = DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)];
    const depthBg = DEPTH_BG[Math.min(depth, DEPTH_BG.length - 1)];

    return (
      <>
        <tr onClick={() => onOpenPanel(issue)}
          className={`hover:bg-blue-50/40 transition-colors cursor-pointer group border-b border-slate-100 ${depthBg}`}>
          <td className="px-4 py-2.5">
            <div className="flex items-center gap-1" style={{ paddingLeft: depth * 28 }}>
              {depth > 0 && (
                <span className={`absolute left-0 w-0.5 top-0 bottom-0 ${DEPTH_BORDER[Math.min(depth, DEPTH_BORDER.length - 1)]}`} />
              )}
              {hasChildren ? (
                <button onClick={e => { e.stopPropagation(); toggle(issue.key); }}
                  className="p-0.5 rounded hover:bg-slate-200 text-slate-400 transition-all flex-shrink-0">
                  <ChevronRight size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                </button>
              ) : (
                <span className="w-5 flex-shrink-0" />
              )}
              <TypeIcon size={13} className={`flex-shrink-0 ${depth === 0 ? 'text-violet-500' : depth === 1 ? 'text-blue-400' : 'text-slate-400'}`} />
              <span className={`font-mono text-[11px] font-bold ${depthColor}`}>{issue.key}</span>
              {hasChildren && (
                <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-medium ml-1">
                  {children.length}
                </span>
              )}
            </div>
          </td>
          <td className="px-4 py-2.5 max-w-md">
            <span className={`font-medium text-[13px] leading-snug ${isConcluido ? 'line-through text-slate-400' : depth === 0 ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
              {issue.summary}
            </span>
          </td>
          <td className="px-4 py-2.5">
            {issue.assigneeName ? (
              <div className="flex items-center gap-1.5">
                {issue.assigneeAvatar
                  ? <img src={issue.assigneeAvatar} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                  : <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0"><span className="text-[9px] text-white font-bold">{issue.assigneeName.charAt(0)}</span></div>
                }
                <span className="text-xs text-slate-500 truncate max-w-[90px]">{issue.assigneeName.split(' ')[0]}</span>
              </div>
            ) : <span className="text-xs text-slate-300">—</span>}
          </td>
          <td className="px-4 py-2.5">
            <span className={`text-xs font-bold ${PRIORITY_CLS[issue.priority] ?? 'text-slate-400'}`}>
              {PRIORITY_ICON[issue.priority] ?? '–'}
            </span>
          </td>
          <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
            <StatusDropdown current={issue.status} onSelect={t => onStatusChange(issue.key, t)} />
          </td>
          <td className="px-4 py-2.5 text-xs text-slate-400">{formatDate(issue.created)}</td>
          <td className="px-4 py-2.5 text-xs text-slate-400">{formatDate(issue.updated)}</td>
          <td className="px-4 py-2.5">
            <a href={issue.webUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-1.5 rounded text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all inline-flex">
              <ExternalLink size={12} />
            </a>
          </td>
        </tr>
        {hasChildren && isOpen && children.map(child => (
          <IssueRow key={child.key} issue={child} depth={depth + 1} />
        ))}
      </>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 w-52 text-xs font-semibold text-slate-400 uppercase tracking-wide">Ticket</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Resumo</th>
                <th className="text-left px-4 py-3 w-36 text-xs font-semibold text-slate-400 uppercase tracking-wide">Responsável</th>
                <th className="text-left px-4 py-3 w-20 text-xs font-semibold text-slate-400 uppercase tracking-wide">Prior.</th>
                <th className="text-left px-4 py-3 w-36 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 w-24 text-xs font-semibold text-slate-400 uppercase tracking-wide">Criado</th>
                <th className="text-left px-4 py-3 w-28 text-xs font-semibold text-slate-400 uppercase tracking-wide">Atualizado</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {roots.map(p => <IssueRow key={p.key} issue={p} depth={0} />)}
              {issues.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-16 text-center text-slate-400 text-sm">Nenhum issue encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Calendário (com drag & drop) ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function CalendarioView({ issues, onOpenPanel, onDuedateChange }: {
  issues: JiraIssue[];
  onOpenPanel: (i: JiraIssue) => void;
  onDuedateChange: (key: string, newDate: string | null) => void;
}) {
  const [current, setCurrent] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);
  const [dragOverSidebar, setDragOverSidebar] = useState(false);

  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(current.year, current.month, 1).getDay();
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const monthName = new Date(current.year, current.month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const issuesByDay = useMemo(() => {
    const map: Record<number, JiraIssue[]> = {};
    issues.forEach(i => {
      if (!i.duedate) return;
      const d = new Date(i.duedate);
      if (d.getFullYear() === current.year && d.getMonth() === current.month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(i);
      }
    });
    return map;
  }, [issues, current]);

  const unscheduled = useMemo(() => issues.filter(i => !i.duedate && i.status !== 'Concluído'), [issues]);

  function prev() { setCurrent(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }); }
  function next() { setCurrent(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }); }
  function goToday() { const d = new Date(); setCurrent({ year: d.getFullYear(), month: d.getMonth() }); }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === current.year && today.getMonth() === current.month;
  const todayDay = today.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  function handleDropOnDay(day: number, e: React.DragEvent) {
    e.preventDefault();
    setDragOverDay(null);
    const issueKey = e.dataTransfer.getData('text/plain');
    if (!issueKey) return;
    const pad = (n: number) => String(n).padStart(2, '0');
    const newDate = `${current.year}-${pad(current.month + 1)}-${pad(day)}`;
    onDuedateChange(issueKey, newDate);
  }

  function handleDropOnSidebar(e: React.DragEvent) {
    e.preventDefault();
    setDragOverSidebar(false);
    const issueKey = e.dataTransfer.getData('text/plain');
    if (!issueKey) return;
    onDuedateChange(issueKey, null);
  }

  return (
    <div className="p-4 flex gap-4">
      <div className="flex-1">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <button onClick={goToday} className="text-xs font-medium text-slate-500 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors">Hoje</button>
            <div className="flex items-center gap-3">
              <button onClick={prev} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">&lt;</button>
              <span className="text-sm font-semibold text-slate-700 capitalize min-w-[140px] text-center">{monthName}</span>
              <button onClick={next} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">&gt;</button>
            </div>
            <span className="text-xs text-slate-400">Arraste para mover</span>
          </div>

          <div className="grid grid-cols-7 border-b border-slate-100">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const dayIssues = day ? (issuesByDay[day] || []) : [];
              const isToday = isCurrentMonth && day === todayDay;
              const isDragTarget = day === dragOverDay;
              return (
                <div key={idx}
                  className={`min-h-[100px] border-b border-r border-slate-100 p-1.5 transition-colors duration-150
                    ${day ? 'bg-white' : 'bg-slate-50/50'}
                    ${isToday ? 'bg-blue-50/50' : ''}
                    ${isDragTarget ? 'bg-blue-100 ring-2 ring-inset ring-blue-400' : ''}`}
                  onDragOver={e => { if (day) { e.preventDefault(); setDragOverDay(day); } }}
                  onDragLeave={() => setDragOverDay(null)}
                  onDrop={e => { if (day) handleDropOnDay(day, e); }}
                >
                  {day && (
                    <>
                      <span className={`text-xs font-medium inline-flex items-center justify-center ${isToday ? 'bg-blue-600 text-white w-6 h-6 rounded-full' : 'text-slate-500'}`}>
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayIssues.slice(0, 3).map(i => (
                          <div key={i.key}
                            draggable
                            onDragStart={e => {
                              e.dataTransfer.setData('text/plain', i.key);
                              e.dataTransfer.effectAllowed = 'move';
                              (e.currentTarget as HTMLElement).style.opacity = '0.4';
                            }}
                            onDragEnd={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                            onClick={ev => { ev.stopPropagation(); onOpenPanel(i); }}
                            className={`w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate font-medium transition-colors cursor-grab active:cursor-grabbing ${statusCls(i.status)} hover:opacity-80`}>
                            {i.summary}
                          </div>
                        ))}
                        {dayIssues.length > 3 && (
                          <span className="text-[9px] text-slate-400 px-1.5">+{dayIssues.length - 3} mais</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar: unscheduled -- also a drop zone to remove duedate */}
      <div className="w-72 flex-shrink-0">
        <div className={`bg-white rounded-xl border shadow-sm p-4 transition-all duration-150
          ${dragOverSidebar ? 'border-amber-400 ring-2 ring-amber-200 bg-amber-50/30' : 'border-slate-200'}`}
          onDragOver={e => { e.preventDefault(); setDragOverSidebar(true); }}
          onDragLeave={() => setDragOverSidebar(false)}
          onDrop={handleDropOnSidebar}
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-1">Trabalho não agendado</h3>
          <p className="text-[10px] text-slate-400 mb-3">{dragOverSidebar ? 'Solte para remover data' : 'Arraste para o calendário'}</p>
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
            {unscheduled.map(i => (
              <div key={i.key}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('text/plain', i.key);
                  e.dataTransfer.effectAllowed = 'move';
                  (e.currentTarget as HTMLElement).style.opacity = '0.4';
                }}
                onDragEnd={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                onClick={() => onOpenPanel(i)}
                className="w-full text-left p-2.5 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group cursor-grab active:cursor-grabbing">
                <p className="text-xs font-medium text-slate-700 leading-snug line-clamp-2 group-hover:text-blue-700">{i.summary}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-mono text-[10px] text-blue-600 font-bold">{i.key}</span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusCls(i.status)}`}>{i.status}</span>
                  <span className={`text-[10px] font-bold ${PRIORITY_CLS[i.priority] ?? 'text-slate-400'}`}>{PRIORITY_ICON[i.priority]}</span>
                  {i.assigneeAvatar && <img src={i.assigneeAvatar} alt="" className="w-4 h-4 rounded-full ml-auto" />}
                </div>
              </div>
            ))}
            {unscheduled.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">Todos os issues têm data ✓</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Cronograma (Timeline / Gantt) ────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function CronogramaView({ issues, onOpenPanel }: {
  issues: JiraIssue[];
  onOpenPanel: (i: JiraIssue) => void;
}) {
  const [escala, setEscala] = useState<'semanas' | 'meses' | 'trimestres'>('meses');

  const parentIssues = issues.filter(i => !i.parentKey);
  const childMap = useMemo(() => {
    const map: Record<string, JiraIssue[]> = {};
    issues.forEach(i => {
      if (i.parentKey) {
        if (!map[i.parentKey]) map[i.parentKey] = [];
        map[i.parentKey].push(i);
      }
    });
    return map;
  }, [issues]);

  const parentKeys = new Set(parentIssues.map(p => p.key));
  const orphans = issues.filter(i => i.parentKey && !parentKeys.has(i.parentKey));

  const allDates = issues.flatMap(i => [i.created, i.duedate, i.updated].filter(Boolean) as string[]).map(d => new Date(d).getTime());
  const minTime = allDates.length > 0 ? Math.min(...allDates) : Date.now();
  const maxTime = allDates.length > 0 ? Math.max(...allDates, Date.now() + 90 * 86400000) : Date.now() + 180 * 86400000;

  const timelineStart = new Date(minTime);
  timelineStart.setDate(1);
  const timelineEnd = new Date(maxTime);
  timelineEnd.setMonth(timelineEnd.getMonth() + 1, 0);

  const totalDays = Math.max(1, Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / 86400000));

  const months = useMemo(() => {
    const result: { label: string; startPx: number; widthPx: number }[] = [];
    const d = new Date(timelineStart);
    while (d <= timelineEnd) {
      const monthStart = new Date(d);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const monthEnd = new Date(Math.min(nextMonth.getTime() - 1, timelineEnd.getTime()));
      const startDay = Math.max(0, Math.ceil((monthStart.getTime() - timelineStart.getTime()) / 86400000));
      const endDay = Math.ceil((monthEnd.getTime() - timelineStart.getTime()) / 86400000);
      const px = (startDay / totalDays) * 100;
      const w = ((endDay - startDay + 1) / totalDays) * 100;
      result.push({
        label: monthStart.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        startPx: px,
        widthPx: w,
      });
      d.setMonth(d.getMonth() + 1);
      d.setDate(1);
    }
    return result;
  }, [timelineStart, timelineEnd, totalDays]);

  const todayPx = ((Date.now() - timelineStart.getTime()) / 86400000 / totalDays) * 100;

  function getBar(issue: JiraIssue) {
    const start = issue.created ? new Date(issue.created) : new Date();
    const end = issue.duedate ? new Date(issue.duedate) : (issue.updated ? new Date(issue.updated) : new Date(start.getTime() + 7 * 86400000));
    const startDay = Math.max(0, (start.getTime() - timelineStart.getTime()) / 86400000);
    const endDay = Math.max(startDay + 1, (end.getTime() - timelineStart.getTime()) / 86400000);
    const left = (startDay / totalDays) * 100;
    const width = Math.max(0.5, ((endDay - startDay) / totalDays) * 100);
    return { left, width };
  }

  const BAR_COLORS: Record<string, string> = {
    'Concluído': 'bg-green-400',
    'Em andamento': 'bg-blue-500',
    'A fazer': 'bg-yellow-400',
    'Em análise': 'bg-amber-400',
    'Ideia': 'bg-slate-300',
  };

  function TimelineRow({ issue, depth }: { issue: JiraIssue; depth: number }) {
    const children = childMap[issue.key] || [];
    const [open, setOpen] = useState(true);
    const bar = getBar(issue);
    const barColor = BAR_COLORS[issue.status] || 'bg-purple-400';
    const isConcluido = issue.status === 'Concluído';

    return (
      <>
        <div className="flex border-b border-slate-100 hover:bg-blue-50/30 transition-colors group" style={{ minHeight: 40 }}>
          <div className="w-[340px] flex-shrink-0 flex items-center gap-1 px-3 py-2 border-r border-slate-200 bg-white"
            style={{ paddingLeft: 12 + depth * 20 }}>
            {children.length > 0 ? (
              <button onClick={() => setOpen(o => !o)} className="p-0.5 rounded hover:bg-slate-200 text-slate-400 flex-shrink-0">
                {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              </button>
            ) : <span className="w-5 flex-shrink-0" />}
            <button onClick={() => onOpenPanel(issue)} className="flex items-center gap-1.5 min-w-0 group/link">
              <span className={`font-mono text-[10px] font-bold flex-shrink-0 ${depth === 0 ? 'text-violet-600' : 'text-blue-600'}`}>{issue.key}</span>
              <span className={`text-xs truncate max-w-[180px] ${isConcluido ? 'line-through text-slate-400' : 'text-slate-700 group-hover/link:text-blue-600'}`}>
                {issue.summary}
              </span>
            </button>
            {isConcluido && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold ml-auto flex-shrink-0">✓</span>}
          </div>

          <div className="flex-1 relative">
            <div
              onClick={() => onOpenPanel(issue)}
              className={`absolute top-2 h-5 rounded-full ${barColor} cursor-pointer hover:opacity-80 transition-opacity shadow-sm`}
              style={{ left: `${bar.left}%`, width: `${bar.width}%`, minWidth: 6 }}
              title={`${issue.key}: ${issue.summary}`}
            />
          </div>
        </div>
        {open && children.map(child => (
          <TimelineRow key={child.key} issue={child} depth={depth + 1} />
        ))}
      </>
    );
  }

  return (
    <div className="p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {(['semanas', 'meses', 'trimestres'] as const).map(e => (
              <button key={e} onClick={() => setEscala(e)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors capitalize ${escala === e ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100'}`}>
                {e}
              </button>
            ))}
          </div>
          <span className="text-[10px] text-slate-400">Hoje: {new Date().toLocaleDateString('pt-BR')}</span>
        </div>

        <div className="overflow-x-auto">
          <div style={{ minWidth: Math.max(900, totalDays * (escala === 'semanas' ? 8 : escala === 'meses' ? 3 : 1.5)) }}>
            <div className="flex border-b border-slate-200">
              <div className="w-[340px] flex-shrink-0 border-r border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ticket</span>
              </div>
              <div className="flex-1 relative bg-slate-50">
                <div className="flex h-full">
                  {months.map((m, i) => (
                    <div key={i} className="border-r border-slate-200 text-center py-2" style={{ width: `${m.widthPx}%` }}>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              {todayPx >= 0 && todayPx <= 100 && (
                <div className="absolute top-0 bottom-0 w-px bg-blue-500 z-10 pointer-events-none"
                  style={{ left: `calc(340px + (100% - 340px) * ${todayPx / 100})` }}>
                  <div className="absolute -top-0.5 -left-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
                </div>
              )}

              {parentIssues.map(p => <TimelineRow key={p.key} issue={p} depth={0} />)}
              {orphans.map(o => <TimelineRow key={o.key} issue={o} depth={0} />)}

              {issues.length === 0 && (
                <div className="px-4 py-16 text-center text-slate-400 text-sm">Nenhum issue encontrado</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Quadro (Kanban board with drag & drop) ───────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

function QuadroView({ issues, onOpenPanel, onStatusChange, onShowCreate }: {
  issues: JiraIssue[];
  onOpenPanel: (i: JiraIssue) => void;
  onStatusChange: (key: string, t: typeof TRANSITIONS[0]) => void;
  onShowCreate: () => void;
}) {
  return (
    <div className="p-4 overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-4">
        {COLUNAS_QUADRO.map(col => {
          const items = issues.filter(i => i.status === col.status);
          const transition = TRANSITIONS.find(t => t.name === col.status);
          return (
            <div key={col.status}
              className={`w-64 flex flex-col rounded-xl border-2 transition-all duration-200 ${col.cor}`}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-blue-400', 'scale-[1.02]'); }}
              onDragLeave={e => { e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'scale-[1.02]'); }}
              onDrop={e => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'scale-[1.02]');
                const issueKey = e.dataTransfer.getData('text/plain');
                if (issueKey && transition) {
                  const issue = issues.find(i => i.key === issueKey);
                  if (issue && issue.status !== col.status) {
                    onStatusChange(issueKey, transition);
                    // Fire Jira API transition
                    fetchAutenticado('/api/jira-transition', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ key: issueKey, transitionId: transition.id }),
                    });
                  }
                }
              }}
            >
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(col.status)}`} />
                <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex-1">{col.titulo}</h3>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${col.badge}`}>{items.length}</span>
                <button onClick={() => { onShowCreate(); }}
                  className="p-0.5 rounded text-slate-300 hover:text-slate-500 transition-colors" title="Criar issue">
                  <Plus size={13} />
                </button>
              </div>
              <div className="overflow-y-auto px-2 pb-2 space-y-2 max-h-[calc(100vh-280px)]">
                {items.map(issue => {
                  const TypeIcon = ISSUE_TYPE_ICON[issue.issuetype] || CheckSquare;
                  const isConcluido = issue.status === 'Concluído';
                  return (
                    <div key={issue.key}
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('text/plain', issue.key);
                        e.dataTransfer.effectAllowed = 'move';
                        (e.currentTarget as HTMLElement).style.opacity = '0.5';
                        (e.currentTarget as HTMLElement).style.transform = 'rotate(2deg) scale(1.05)';
                      }}
                      onDragEnd={e => {
                        (e.currentTarget as HTMLElement).style.opacity = '1';
                        (e.currentTarget as HTMLElement).style.transform = '';
                      }}
                      onClick={() => onOpenPanel(issue)}
                      className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md hover:border-blue-200 transition-all cursor-grab active:cursor-grabbing group">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <TypeIcon size={11} className="text-slate-400 flex-shrink-0" />
                          <span className="font-mono text-[10px] font-bold text-blue-600">{issue.key}</span>
                        </div>
                        <a href={issue.webUrl} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-slate-200 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all">
                          <ExternalLink size={11} />
                        </a>
                      </div>
                      <p className={`text-xs font-semibold mb-2 leading-snug line-clamp-2 ${isConcluido ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {issue.summary}
                      </p>
                      {issue.parentSummary && (
                        <p className="text-[10px] text-slate-400 truncate mb-2">{issue.parentSummary}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold ${PRIORITY_CLS[issue.priority] ?? 'text-slate-300'}`}>
                          {PRIORITY_ICON[issue.priority] ?? '–'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {issue.labels.length > 0 && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">{issue.labels[0]}</span>
                          )}
                          {issue.assigneeName && (
                            issue.assigneeAvatar
                              ? <img src={issue.assigneeAvatar} alt="" className="w-5 h-5 rounded-full" title={issue.assigneeName} />
                              : <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0" title={issue.assigneeName}>
                                  <span className="text-[9px] text-white font-bold">{issue.assigneeName.charAt(0)}</span>
                                </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <div className="text-xs text-slate-400 text-center py-4 border-2 border-dashed border-slate-200 rounded-xl">
                    Nenhum issue
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
