import { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { SidebarAutenticada } from './SidebarAutenticada';
import { PauloAjuda } from './PauloAjuda';
import { ChatMembros } from '../ChatMembros';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../infrastructure/supabase/client';
import { ChevronsLeft, ChevronsRight, Menu, X } from 'lucide-react';

const STORAGE_KEY_SIDEBAR_HIDDEN = 'layout-sidebar-hidden-v1';

export function LayoutAutenticado() {
  const { isAuthenticated, loading, erroConexao, usuario } = useAuth();
  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [sidebarOcultaDesktop, setSidebarOcultaDesktop] = useState(false);
  const [pauloAberto, setPauloAberto] = useState(false);
  const [chatAberto, setChatAberto] = useState(false);
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);
  const [toastNotif, setToastNotif] = useState<{ nome: string; conteudo: string } | null>(null);
  const chatAbertoRef = useRef(chatAberto);
  const ultimoCountRef = useRef(0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    chatAbertoRef.current = chatAberto;
    if (chatAberto) {
      setMensagensNaoLidas(0);
    }
  }, [chatAberto]);

  // Toca som quando a contagem de não lidas aumenta
  useEffect(() => {
    if (mensagensNaoLidas > ultimoCountRef.current) {
      tocarSomNotificacao();
    }
    ultimoCountRef.current = mensagensNaoLidas;
  }, [mensagensNaoLidas]);

  function tocarSomNotificacao() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const agora = audioContext.currentTime;

      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioContext.destination);

      osc1.frequency.setValueAtTime(800, agora);
      osc1.frequency.exponentialRampToValueAtTime(1000, agora + 0.1);
      osc1.type = 'sine';

      osc2.frequency.setValueAtTime(1200, agora + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(1400, agora + 0.15);
      osc2.type = 'sine';

      gain.gain.setValueAtTime(0.4, agora);
      gain.gain.exponentialRampToValueAtTime(0.1, agora + 0.2);

      osc1.start(agora);
      osc1.stop(agora + 0.1);
      osc2.start(agora + 0.05);
      osc2.stop(agora + 0.15);
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    if (!usuario?.id) return;

    const channel = supabase
      .channel(`chat-unread-${usuario.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_mensagens' },
        (payload) => {
          const nova = payload.new as {
            canal: string;
            remetente_id: string;
            remetente_nome: string;
            destinatario_id: string | null;
            conteudo: string;
            arquivo_nome: string | null;
          };

          if (nova.remetente_id === usuario.id) return;

          const ehMensagemGeral = nova.canal === 'geral';
          const ehDmParaMim = nova.canal === 'dm' && nova.destinatario_id === usuario.id;

          if (ehMensagemGeral || ehDmParaMim) {
            if (!chatAbertoRef.current) {
              setMensagensNaoLidas((prev) => Math.min(prev + 1, 99));
            }
            const preview = nova.conteudo?.trim() || nova.arquivo_nome || '📎 arquivo';
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            setToastNotif({ nome: nova.remetente_nome, conteudo: preview });
            toastTimeoutRef.current = setTimeout(() => setToastNotif(null), 4000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [usuario?.id]);

  // ── Presença global (registra online para todos os usuários autenticados) ──
  useEffect(() => {
    if (!usuario?.id) return;

    function registrarOnline() {
      supabase.from('presenca_usuarios').upsert({
        user_id: usuario!.id,
        esta_online: true,
        ultimo_heartbeat: new Date().toISOString(),
        ultima_entrada: new Date().toISOString(),
      }, { onConflict: 'user_id' }).then();
    }

    registrarOnline();

    // Heartbeat a cada 30s para manter staleness check do servidor OK
    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'hidden') return; // não gasta heartbeat se aba está oculta
      supabase.from('presenca_usuarios').update({
        esta_online: true,
        ultimo_heartbeat: new Date().toISOString(),
      }).eq('user_id', usuario.id).then();
    }, 30000);

    function marcarOffline() {
      supabase.from('presenca_usuarios').update({
        esta_online: false,
        ultimo_heartbeat: new Date().toISOString(),
        ultima_entrada: null,
      }).eq('user_id', usuario!.id).then();
    }

    // visibilitychange: marca offline ao ocultar aba, online ao voltar
    function handleVisibility() {
      if (document.visibilityState === 'hidden') {
        marcarOffline();
      } else {
        registrarOnline();
      }
    }

    window.addEventListener('beforeunload', marcarOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('beforeunload', marcarOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [usuario?.id, usuario?.nome]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SIDEBAR_HIDDEN);
      if (raw === '1') {
        setSidebarOcultaDesktop(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SIDEBAR_HIDDEN, sidebarOcultaDesktop ? '1' : '0');
    } catch {
      // ignore storage errors
    }
  }, [sidebarOcultaDesktop]);

  const fecharSidebar = () => setSidebarAberta(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (erroConexao) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Erro de conexão</h2>
          <p className="text-gray-600 mb-4">{erroConexao}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Top bar mobile */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-slate-900 z-30 lg:hidden flex items-center px-3 gap-3 shadow-lg">
        <button
          onClick={() => setSidebarAberta(true)}
          className="relative text-white p-1.5 rounded-lg hover:bg-slate-800"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
          {mensagensNaoLidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {mensagensNaoLidas > 99 ? '99+' : mensagensNaoLidas}
            </span>
          )}
        </button>
        <img src="/logo-biasi-branco.png" alt="Biasi" className="h-6 w-auto" />
      </div>

      {sidebarAberta && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={fecharSidebar}
        />
      )}

      {sidebarOcultaDesktop && (
        <button
          type="button"
          onClick={() => setSidebarOcultaDesktop(false)}
          className="hidden lg:flex fixed top-4 left-3 z-40 items-center justify-center rounded-full bg-slate-900 text-white w-9 h-9 shadow-lg hover:bg-slate-800 transition-colors relative"
          aria-label="Mostrar menu lateral"
          title="Mostrar menu"
        >
          <ChevronsRight size={16} />
          {mensagensNaoLidas > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none border border-white">
              {mensagensNaoLidas > 99 ? '99+' : mensagensNaoLidas}
            </span>
          )}
        </button>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-[85vw] sm:w-64
        transform transition-transform duration-200 ease-in-out
        ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarOcultaDesktop ? 'lg:-translate-x-full' : 'lg:translate-x-0'}
      `}>
        <button
          type="button"
          onClick={() => setSidebarOcultaDesktop(true)}
          className="hidden lg:flex absolute top-4 -right-3 z-[60] items-center justify-center h-8 w-8 rounded-full border border-slate-700 bg-slate-900 text-slate-200 shadow-md hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Ocultar menu lateral"
          title="Ocultar menu"
        >
          <ChevronsLeft size={14} />
        </button>

        <button
          type="button"
          onClick={fecharSidebar}
          className="lg:hidden absolute top-4 right-3 z-[60] text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Fechar menu"
        >
          <X size={22} />
        </button>
        <SidebarAutenticada
          onNavigate={fecharSidebar}
          onAbrirPaulo={() => setPauloAberto(true)}
          onAbrirChat={() => setChatAberto(true)}
          unreadCount={mensagensNaoLidas}
        />
      </div>

      {/* Conteúdo principal */}
      <main className={`flex-1 flex flex-col min-h-screen min-w-0 pt-12 lg:pt-0 overflow-x-hidden ${sidebarOcultaDesktop ? 'lg:ml-0' : 'lg:ml-64'}`}>
        <Outlet />
      </main>

      <PauloAjuda forceOpen={pauloAberto} onClose={() => setPauloAberto(false)} />
      <ChatMembros aberto={chatAberto} onFechar={() => setChatAberto(false)} />

      {/* Toast de nova mensagem */}
      {toastNotif && (
        <div
          className="fixed bottom-20 right-4 z-[200] flex items-center gap-3 bg-slate-900 text-white pl-3 pr-2 py-2.5 rounded-2xl shadow-2xl border border-slate-700 cursor-pointer max-w-[280px]"
          style={{ animation: 'slideInRight 0.2s ease-out' }}
          onClick={() => { setChatAberto(true); setToastNotif(null); if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); }}
        >
          <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold">{toastNotif.nome.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold leading-tight truncate">{toastNotif.nome}</p>
            <p className="text-[11px] text-slate-300 leading-tight truncate mt-0.5">{toastNotif.conteudo}</p>
          </div>
          <button
            className="p-1 text-slate-400 hover:text-white flex-shrink-0 rounded-lg hover:bg-slate-700"
            onClick={(e) => { e.stopPropagation(); setToastNotif(null); if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
