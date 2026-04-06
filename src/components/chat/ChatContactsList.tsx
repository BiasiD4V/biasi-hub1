import { Search, Hash, Users } from 'lucide-react';
import type { Membro } from './chatTypes';
import { getAvatarColor, formatTempoOnline, formatUltimoVisto } from './chatTypes';

export interface ChatContactsListProps {
  membros: Membro[];
  buscaMembro: string;
  geralNaoLida: boolean;
  naoLidasPorConta: Set<string>;
  onBuscaMembro: (val: string) => void;
  onAbrirCanal: (tipo: 'geral') => void;
  onAbrirDM: (membro: Membro) => void;
}

export function ChatContactsList({
  membros,
  buscaMembro,
  geralNaoLida,
  naoLidasPorConta,
  onBuscaMembro,
  onAbrirCanal,
  onAbrirDM,
}: ChatContactsListProps) {
  const membrosFiltrados = buscaMembro
    ? membros.filter(m => m.nome.toLowerCase().includes(buscaMembro.toLowerCase()))
    : membros;

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Search */}
      <div className="p-3 pb-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={buscaMembro}
            onChange={e => onBuscaMembro(e.target.value)}
            placeholder="Buscar conversa..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Channels */}
      <div className="p-3">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
          <Hash size={10} className="text-slate-300" />
          Canais
        </p>
        <button
          onClick={() => onAbrirCanal('geral')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all text-left group"
        >
          <div className="bg-slate-100 group-hover:bg-blue-100 rounded-lg p-2 transition-colors">
            <Hash size={14} className="text-slate-500 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-slate-700">Geral</span>
            <p className="text-[10px] text-slate-400 truncate">Canal aberto para toda a equipe</p>
          </div>
          {geralNaoLida && (
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 ml-2 animate-pulse shadow-sm shadow-blue-500/50" />
          )}
        </button>
      </div>

      {/* Direct Messages */}
      <div className="px-3 pb-3">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
          <Users size={10} className="text-slate-300" />
          Mensagens Diretas
        </p>
        <div className="space-y-0.5">
          {membrosFiltrados.map(m => (
            <button
              key={m.id}
              onClick={() => onAbrirDM(m)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all text-left group"
            >
              <div className="relative flex-shrink-0">
                <div className={`bg-gradient-to-br ${getAvatarColor(m.nome)} rounded-full w-9 h-9 flex items-center justify-center shadow-sm`}>
                  <span className="text-white text-xs font-bold">{m.nome.charAt(0).toUpperCase()}</span>
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${m.esta_online ? 'bg-emerald-400' : 'bg-slate-300'}`} />
              </div>
              <div className="min-w-0 flex-1 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{m.nome}</p>
                  <p className={`text-[10px] ${m.esta_online ? 'text-emerald-500 font-medium' : 'text-slate-400'}`}>
                    {m.esta_online ? formatTempoOnline(m.conectado_desde) : formatUltimoVisto(m.ultimo_visto)}
                  </p>
                </div>
                {naoLidasPorConta.has(m.id) && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 ml-2 animate-pulse shadow-sm shadow-blue-500/50" />
                )}
              </div>
            </button>
          ))}
          {membrosFiltrados.length === 0 && membros.length > 0 && (
            <p className="text-xs text-slate-400 px-3 py-4 text-center">Nenhum resultado para &ldquo;{buscaMembro}&rdquo;</p>
          )}
          {membros.length === 0 && (
            <div className="text-center py-6 px-3">
              <Users size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-400">Nenhum membro disponível</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
