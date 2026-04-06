import { useState, useEffect, useRef } from 'react';
import {
  RefreshCw, ExternalLink, Plus, X, ChevronDown, Send,
  CheckSquare, Clock, Tag, User, AlertCircle, MessageSquare,
} from 'lucide-react';
import type { JiraIssue, JiraComment, JiraIssueDetail } from './biraTypes';
import {
  TRANSITIONS, ISSUE_TYPES_CREATE, PRIORITIES_CREATE,
  ISSUE_TYPE_ICON, PRIORITY_CLS, PRIORITY_ICON,
  statusCls, statusDot, formatDate, formatDateTime, timeAgo,
} from './biraTypes';
import { fetchAutenticado } from '../../utils/fetchAutenticado';

// ── StatusDropdown (internal) ─────────────────────────────────────────────────
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

// ── Issue Detail Panel ────────────────────────────────────────────────────────
export interface IssuePanelProps {
  issue: JiraIssue;
  detail: JiraIssueDetail | null;
  loadingDetail: boolean;
  onClose: () => void;
  onStatusChange: (key: string, t: typeof TRANSITIONS[0]) => void;
  onCommentAdded: (key: string, comment: JiraComment) => void;
}

export function IssuePanel({
  issue, detail, loadingDetail, onClose, onStatusChange, onCommentAdded,
}: IssuePanelProps) {
  const [changingStatus, setChangingStatus] = useState(false);
  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const TypeIcon = ISSUE_TYPE_ICON[issue.issuetype] || CheckSquare;

  async function handleStatusChange(t: typeof TRANSITIONS[0]) {
    setChangingStatus(true);
    try {
      const res = await fetchAutenticado('/api/jira-transition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: issue.key, transitionId: t.id }),
      });
      if (res.ok) onStatusChange(issue.key, t);
    } catch {}
    setChangingStatus(false);
  }

  async function handleSendComment() {
    if (!comment.trim()) return;
    setSendingComment(true);
    try {
      const res = await fetchAutenticado('/api/jira-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: issue.key, body: comment.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        onCommentAdded(issue.key, {
          id: data.id,
          author: 'Você',
          authorAvatar: null,
          body: comment.trim(),
          created: data.created || new Date().toISOString(),
        });
        setComment('');
      }
    } catch {}
    setSendingComment(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden border-l border-slate-200">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <TypeIcon size={15} className="text-slate-400" />
            <span className="text-sm font-mono text-blue-600 font-bold">{issue.key}</span>
            {issue.parentKey && (
              <span className="text-xs text-slate-400">· {issue.parentKey}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a href={issue.webUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors">
              <ExternalLink size={13} />
              Abrir no Jira
            </a>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 pt-4 pb-6 space-y-5">
            {/* Summary */}
            <h2 className="text-lg font-bold text-slate-800 leading-snug">{issue.summary}</h2>

            {/* Status + Priority */}
            <div className="flex items-center gap-3 flex-wrap">
              <StatusDropdown current={issue.status} onSelect={handleStatusChange} disabled={changingStatus} />
              <span className={`text-xs font-bold ${PRIORITY_CLS[issue.priority] ?? 'text-slate-400'}`}>
                {PRIORITY_ICON[issue.priority] ?? '–'} {issue.priority}
              </span>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4 text-xs">
              <div>
                <p className="text-slate-400 mb-1 flex items-center gap-1"><User size={10} /> Responsável</p>
                {issue.assigneeName ? (
                  <div className="flex items-center gap-1.5">
                    {issue.assigneeAvatar
                      ? <img src={issue.assigneeAvatar} alt="" className="w-5 h-5 rounded-full" />
                      : <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center"><span className="text-[9px] text-white font-bold">{issue.assigneeName.charAt(0)}</span></div>
                    }
                    <span className="font-medium text-slate-700">{issue.assigneeName}</span>
                  </div>
                ) : <span className="text-slate-400">—</span>}
              </div>
              <div>
                <p className="text-slate-400 mb-1 flex items-center gap-1"><Tag size={10} /> Tipo</p>
                <span className="font-medium text-slate-700">{issue.issuetype}</span>
              </div>
              <div>
                <p className="text-slate-400 mb-1 flex items-center gap-1"><Clock size={10} /> Criado</p>
                <span className="text-slate-600">{formatDateTime(issue.created)}</span>
              </div>
              <div>
                <p className="text-slate-400 mb-1 flex items-center gap-1"><Clock size={10} /> Atualizado</p>
                <span className="text-slate-600">{timeAgo(issue.updated)}</span>
              </div>
              {issue.duedate && (
                <div>
                  <p className="text-slate-400 mb-1 flex items-center gap-1"><AlertCircle size={10} /> Prazo</p>
                  <span className="text-slate-600">{formatDate(issue.duedate)}</span>
                </div>
              )}
              {issue.parentSummary && (
                <div className="col-span-2">
                  <p className="text-slate-400 mb-1">Epic / Pai</p>
                  <span className="font-mono text-blue-600 font-bold text-[10px]">{issue.parentKey}</span>
                  <span className="text-slate-600 ml-1">{issue.parentSummary}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Descrição</h3>
              {loadingDetail ? (
                <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              ) : detail?.description ? (
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 rounded-xl p-3">
                  {detail.description}
                </pre>
              ) : (
                <p className="text-sm text-slate-400 italic">Sem descrição</p>
              )}
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <MessageSquare size={11} />
                Comentários {detail && `(${detail.comments.length})`}
              </h3>

              {loadingDetail ? (
                <div className="space-y-3">
                  {[1,2].map(i => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {(detail?.comments || []).map(c => (
                    <div key={c.id} className="flex gap-2.5">
                      <div className="flex-shrink-0 mt-0.5">
                        {c.authorAvatar
                          ? <img src={c.authorAvatar} alt="" className="w-7 h-7 rounded-full" />
                          : <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center"><span className="text-[10px] text-white font-bold">{c.author.charAt(0)}</span></div>
                        }
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-700">{c.author}</span>
                          <span className="text-[10px] text-slate-400">{timeAgo(c.created)}</span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.body}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add comment */}
                  <div className="flex gap-2.5 mt-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] text-white font-bold">V</span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Adicionar comentário..."
                        rows={2}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
                        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendComment(); }}
                      />
                      {comment.trim() && (
                        <div className="flex justify-end mt-1.5">
                          <button
                            onClick={handleSendComment}
                            disabled={sendingComment}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                          >
                            <Send size={11} />
                            {sendingComment ? 'Enviando...' : 'Comentar'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create Issue Modal ────────────────────────────────────────────────────────
export interface CreateIssueModalProps {
  onClose: () => void;
  onCreate: (key: string) => void;
}

export function CreateIssueModal({ onClose, onCreate }: CreateIssueModalProps) {
  const [summary, setSummary] = useState('');
  const [typeId, setTypeId] = useState('10004');
  const [priorityId, setPriorityId] = useState('3');
  const [parentKey, setParentKey] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!summary.trim()) { setError('Resumo é obrigatório'); return; }
    setCreating(true);
    setError('');
    try {
      const res = await fetchAutenticado('/api/jira-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: summary.trim(),
          issuetypeId: typeId,
          priorityId,
          parentKey: parentKey.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Erro ao criar'); setCreating(false); return; }
      onCreate(data.key);
    } catch {
      setError('Erro de conexão');
    }
    setCreating(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><Plus size={16} className="text-blue-600" /> Criar Issue</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Tipo</label>
            <div className="flex flex-wrap gap-2">
              {ISSUE_TYPES_CREATE.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTypeId(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      typeId === t.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Icon size={13} /> {t.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Resumo *</label>
            <input
              type="text"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Descreva a tarefa em uma linha..."
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Descrição</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Priority + Parent */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Prioridade</label>
              <select
                value={priorityId}
                onChange={e => setPriorityId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITIES_CREATE.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Epic / Pai (opcional)</label>
              <input
                type="text"
                value={parentKey}
                onChange={e => setParentKey(e.target.value.toUpperCase())}
                placeholder="ORC-59"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
          <button
            onClick={handleCreate}
            disabled={creating || !summary.trim()}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
          >
            {creating ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
            {creating ? 'Criando...' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}
