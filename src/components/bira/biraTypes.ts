import {
  Zap, Star, CheckSquare, BookOpen, Bug, Package, GitBranch,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  statusCategory: string;
  issuetype: string;
  assigneeName: string | null;
  assigneeAvatar: string | null;
  priority: string;
  created: string | null;
  updated: string | null;
  duedate: string | null;
  parentKey: string | null;
  parentSummary: string | null;
  labels: string[];
  webUrl: string;
}

export interface JiraComment {
  id: string;
  author: string;
  authorAvatar: string | null;
  body: string;
  created: string;
}

export interface JiraIssueDetail extends JiraIssue {
  description: string;
  comments: JiraComment[];
}

// ── Constants ──────────────────────────────────────────────────────────────────
export const TRANSITIONS: { id: string; name: string }[] = [
  { id: '11', name: 'Ideia' },
  { id: '21', name: 'A fazer' },
  { id: '31', name: 'Em andamento' },
  { id: '41', name: 'Em análise' },
  { id: '51', name: 'Concluído' },
];

export const STATUS_CONFIG: Record<string, { cls: string; dot: string }> = {
  'Ideia':        { cls: 'bg-slate-100 text-slate-600 border border-slate-200',   dot: 'bg-slate-400' },
  'A fazer':      { cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-400' },
  'Em andamento': { cls: 'bg-blue-100 text-blue-700 border border-blue-200',       dot: 'bg-blue-500' },
  'Em análise':   { cls: 'bg-amber-100 text-amber-700 border border-amber-200',    dot: 'bg-amber-500' },
  'Concluído':    { cls: 'bg-green-100 text-green-700 border border-green-200',    dot: 'bg-green-500' },
};

export function statusCls(s: string) { return STATUS_CONFIG[s]?.cls ?? 'bg-slate-100 text-slate-500 border border-slate-200'; }
export function statusDot(s: string) { return STATUS_CONFIG[s]?.dot ?? 'bg-slate-400'; }

export const COLUNAS_QUADRO = [
  { status: 'Ideia',        titulo: 'IDEIA',        cor: 'border-slate-300 bg-slate-50/60',  badge: 'bg-slate-100 text-slate-600' },
  { status: 'A fazer',      titulo: 'A FAZER',      cor: 'border-yellow-300 bg-yellow-50/60', badge: 'bg-yellow-100 text-yellow-700' },
  { status: 'Em andamento', titulo: 'EM ANDAMENTO', cor: 'border-blue-300 bg-blue-50/60',     badge: 'bg-blue-100 text-blue-700' },
  { status: 'Em análise',   titulo: 'EM ANÁLISE',   cor: 'border-amber-300 bg-amber-50/60',   badge: 'bg-amber-100 text-amber-700' },
  { status: 'Concluído',    titulo: 'CONCLUÍDO',    cor: 'border-green-300 bg-green-50/60',   badge: 'bg-green-100 text-green-700' },
];

export const PRIORITY_CLS: Record<string, string> = {
  Highest: 'text-red-600', High: 'text-orange-500', Medium: 'text-yellow-500',
  Low: 'text-blue-400', Lowest: 'text-slate-400',
};
export const PRIORITY_ICON: Record<string, string> = {
  Highest: '↑↑', High: '↑', Medium: '–', Low: '↓', Lowest: '↓↓',
};

export const ISSUE_TYPE_ICON: Record<string, React.ElementType> = {
  Epic: Zap, Feature: Star, Tarefa: CheckSquare, História: BookOpen,
  Bug: Bug, Recurso: Package, Subtask: GitBranch,
};

export const ISSUE_TYPES_CREATE = [
  { id: '10003', name: 'Feature', icon: Star },
  { id: '10004', name: 'Tarefa', icon: CheckSquare },
  { id: '10005', name: 'História', icon: BookOpen },
  { id: '10006', name: 'Bug', icon: Bug },
  { id: '10007', name: 'Recurso', icon: Package },
];

export const PRIORITIES_CREATE = [
  { id: '1', name: 'Highest' }, { id: '2', name: 'High' },
  { id: '3', name: 'Medium' }, { id: '4', name: 'Low' }, { id: '5', name: 'Lowest' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
export function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
}
export function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
}
export function timeAgo(iso: string | null) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}
