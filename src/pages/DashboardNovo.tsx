import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Activity,
  Target,
  Users,
  Zap,
  CalendarX,
} from 'lucide-react';
import { useNovoOrcamento } from '../context/NovoOrcamentoContext';

interface KpiCardProps {
  label: string;
  valor: string | number;
  sublabel?: string;
  cor?: string;
  iconBg?: string;
  icon: React.ElementType;
  onClick?: () => void;
}

function KpiCard({
  label,
  valor,
  sublabel,
  cor = 'text-slate-800',
  iconBg = 'bg-slate-50',
  icon: Icon,
  onClick,
}: KpiCardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <div className={`${iconBg} rounded-lg p-1.5`}>
          <Icon size={14} className="text-slate-400" />
        </div>
      </div>
      <p className={`text-3xl font-bold ${cor}`}>{valor}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-1">{sublabel}</p>}
    </div>
  );
}

interface ResumoPorResponsavel {
  responsavel: string;
  total: number;
  emAndamento: number;
  vencidos: number;
  ganhos: number;
}

export function DashboardNovo() {
  const navigate = useNavigate();
  const { orcamentos, followUps, pendencias } = useNovoOrcamento();

  const hoje = new Date();

  // ── KPIs pipeline ──────────────────────────────────────────────────────
  const total = orcamentos.length;
  const emAndamento = orcamentos.filter((o) => o.resultadoComercial === 'em_andamento').length;
  const ganhos = orcamentos.filter((o) => o.resultadoComercial === 'ganho').length;
  const perdidos = orcamentos.filter((o) => o.resultadoComercial === 'perdido').length;

  // Taxa de conversão = ganhos / (ganhos + perdidos)
  const fechados = ganhos + perdidos;
  const taxaConversao = fechados > 0 ? Math.round((ganhos / fechados) * 100) : 0;

  // ── KPIs de ação ──────────────────────────────────────────────────────
  // Ações vencidas: apenas em_andamento
  const acoesVencidas = orcamentos.filter(
    (o) =>
      o.resultadoComercial === 'em_andamento' &&
      o.proximaAcao &&
      o.dataProximaAcao &&
      new Date(o.dataProximaAcao + 'T23:59:59') < hoje
  ).length;

  // Sem próxima ação: em_andamento sem proximaAcao
  const semAcaoLista = orcamentos.filter(
    (o) => o.resultadoComercial === 'em_andamento' && !o.proximaAcao
  );
  const semAcaoCount = semAcaoLista.length;

  // Sem interação recente: em_andamento há mais de 14 dias
  const semInteracaoLista = orcamentos.filter((o) => {
    if (o.resultadoComercial !== 'em_andamento') return false;
    const dias =
      (hoje.getTime() - new Date(o.ultimaInteracao).getTime()) / (1000 * 60 * 60 * 24);
    return dias > 14;
  });
  const semInteracaoCount = semInteracaoLista.length;

  // ── Valor em propostas ────────────────────────────────────────────────
  const valorTotal = orcamentos.reduce((acc, o) => acc + (o.valorProposta ?? 0), 0);

  // ── Pendências abertas ────────────────────────────────────────────────
  const totalPendenciasAbertas = pendencias.filter((p) => p.status === 'aberta').length;

  // ── Atividade recente ─────────────────────────────────────────────────
  const duasSemanasAtras = new Date(hoje.getTime() - 14 * 24 * 60 * 60 * 1000);
  const fupRecentes = followUps.filter((f) => new Date(f.data) >= duasSemanasAtras).length;

  // ── Distribuição por etapa ────────────────────────────────────────────
  const porEtapa: Record<string, number> = {};
  orcamentos.forEach((o) => {
    const k = o.etapaAtual;
    porEtapa[k] = (porEtapa[k] ?? 0) + 1;
  });
  const etapasOrdenadas = Object.entries(porEtapa).sort((a, b) => b[1] - a[1]);

  // ── Por responsável ───────────────────────────────────────────────────
  const responsaveisMap = new Map<string, ResumoPorResponsavel>();
  orcamentos.forEach((o) => {
    const nome = o.responsavel || '(sem responsável)';
    if (!responsaveisMap.has(nome)) {
      responsaveisMap.set(nome, { responsavel: nome, total: 0, emAndamento: 0, vencidos: 0, ganhos: 0 });
    }
    const r = responsaveisMap.get(nome)!;
    r.total += 1;
    if (o.resultadoComercial === 'em_andamento') r.emAndamento += 1;
    if (o.resultadoComercial === 'ganho') r.ganhos += 1;
    const acaoVencida =
      o.resultadoComercial === 'em_andamento' &&
      !!o.proximaAcao &&
      !!o.dataProximaAcao &&
      new Date(o.dataProximaAcao + 'T23:59:59') < hoje;
    if (acaoVencida) r.vencidos += 1;
  });
  const porResponsavel = Array.from(responsaveisMap.values()).sort(
    (a, b) => b.total - a.total
  );

  function formatarValor(v: number) {
    if (v === 0) return '—';
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visão geral dos orçamentos e indicadores comerciais
        </p>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 p-8 overflow-y-auto space-y-6">

        {/* ── KPIs pipeline — linha 1 ─────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Pipeline
          </p>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              label="Oportunidades"
              valor={total}
              sublabel="total no funil"
              icon={Activity}
              onClick={() => navigate('/orcamentos')}
            />
            <KpiCard
              label="Em andamento"
              valor={emAndamento}
              sublabel="aguardando fechamento"
              cor="text-blue-600"
              icon={Target}
              onClick={() => navigate('/orcamentos')}
            />
            <KpiCard
              label="Ganhos"
              valor={ganhos}
              sublabel={fechados > 0 ? `${taxaConversao}% dos fechados` : 'negócios fechados'}
              cor="text-green-600"
              icon={TrendingUp}
            />
            <KpiCard
              label="Perdidos"
              valor={perdidos}
              sublabel={perdidos > 0 ? 'analisar motivos de perda' : 'nenhuma perda registrada'}
              cor={perdidos > 0 ? 'text-red-600' : 'text-slate-800'}
              icon={TrendingDown}
            />
          </div>
        </div>

        {/* ── KPIs de ação — linha 2 ──────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Ação comercial
          </p>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              label="Taxa de conversão"
              valor={fechados > 0 ? `${taxaConversao}%` : '—'}
              sublabel={
                fechados > 0
                  ? `${ganhos} ganhos de ${fechados} fechados`
                  : 'nenhum caso fechado ainda'
              }
              cor={
                fechados === 0
                  ? 'text-slate-400'
                  : taxaConversao >= 60
                  ? 'text-green-600'
                  : taxaConversao >= 40
                  ? 'text-amber-600'
                  : 'text-red-600'
              }
              icon={TrendingUp}
            />
            <KpiCard
              label="Ações vencidas"
              valor={acoesVencidas}
              sublabel={acoesVencidas > 0 ? 'requerem atenção imediata' : 'nenhuma ação vencida'}
              cor={acoesVencidas > 0 ? 'text-red-600' : 'text-slate-800'}
              iconBg={acoesVencidas > 0 ? 'bg-red-50' : 'bg-slate-50'}
              icon={CalendarX}
              onClick={acoesVencidas > 0 ? () => navigate('/orcamentos') : undefined}
            />
            <KpiCard
              label="Sem próxima ação"
              valor={semAcaoCount}
              sublabel={semAcaoCount > 0 ? 'em andamento sem follow-up' : 'todos com ação definida'}
              cor={semAcaoCount > 0 ? 'text-amber-600' : 'text-slate-800'}
              iconBg={semAcaoCount > 0 ? 'bg-amber-50' : 'bg-slate-50'}
              icon={AlertTriangle}
              onClick={semAcaoCount > 0 ? () => navigate('/orcamentos') : undefined}
            />
            <KpiCard
              label="Sem interação recente"
              valor={semInteracaoCount}
              sublabel={semInteracaoCount > 0 ? 'mais de 14 dias parados' : 'todos interagidos recentemente'}
              cor={semInteracaoCount > 0 ? 'text-orange-600' : 'text-slate-800'}
              iconBg={semInteracaoCount > 0 ? 'bg-orange-50' : 'bg-slate-50'}
              icon={Clock}
              onClick={semInteracaoCount > 0 ? () => navigate('/orcamentos') : undefined}
            />
          </div>
        </div>

        {/* ── Grid inferior ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-6">

          {/* Distribuição por etapa */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Distribuição por etapa
            </h3>
            {etapasOrdenadas.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Sem dados</p>
            ) : (
              <div className="space-y-3">
                {etapasOrdenadas.map(([etapa, qtd]) => {
                  const pct = total > 0 ? Math.round((qtd / total) * 100) : 0;
                  return (
                    <div key={etapa}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600 truncate">{etapa}</span>
                        <span className="text-xs font-semibold text-slate-700 ml-2 flex-shrink-0">
                          {qtd}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Por responsável */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users size={13} className="text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Por responsável
              </h3>
            </div>
            {porResponsavel.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Sem dados</p>
            ) : (
              <div className="w-full">
                <div className="grid grid-cols-4 gap-1 pb-2 border-b border-slate-100 mb-1">
                  <span className="text-xs font-semibold text-slate-400 col-span-2">Responsável</span>
                  <span className="text-xs font-semibold text-slate-400 text-center">Em abd.</span>
                  <span className="text-xs font-semibold text-slate-400 text-center">Venc.</span>
                </div>
                <div className="space-y-0.5">
                  {porResponsavel.map((r) => (
                    <div
                      key={r.responsavel}
                      className="grid grid-cols-4 gap-1 py-1.5 hover:bg-slate-50 rounded px-1 transition-colors"
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {r.responsavel.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-slate-700 truncate">{r.responsavel.split(' ')[0]}</span>
                        {r.ganhos > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded-full font-medium flex-shrink-0">
                            {r.ganhos}✓
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-blue-600 text-center self-center">
                        {r.emAndamento}
                      </span>
                      <span
                        className={`text-xs font-semibold text-center self-center ${
                          r.vencidos > 0 ? 'text-red-600' : 'text-slate-300'
                        }`}
                      >
                        {r.vencidos > 0 ? r.vencidos : '—'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Taxa de conversão por responsável (mini) */}
                {fechados > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-400 mb-2">Taxa de conversão geral</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${taxaConversao}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-green-600 flex-shrink-0">
                        {taxaConversao}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {ganhos} ganhos de {fechados} fechados
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Painel lateral: alertas + atividade */}
          <div className="space-y-4">

            {/* Sem próxima ação — lista */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Sem próxima ação{' '}
                {semAcaoCount > 0 && (
                  <span className="ml-1 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                    {semAcaoCount}
                  </span>
                )}
              </h3>
              {semAcaoLista.length === 0 ? (
                <div className="flex flex-col items-center py-3 text-center">
                  <Zap size={18} className="text-green-400 mb-1" />
                  <p className="text-xs text-slate-400">Todos com ação definida!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {semAcaoLista.slice(0, 4).map((orc) => (
                    <div
                      key={orc.id}
                      onClick={() => navigate(`/orcamentos/${orc.id}`)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                      <span className="text-xs text-slate-700 truncate">{orc.titulo}</span>
                    </div>
                  ))}
                  {semAcaoLista.length > 4 && (
                    <p className="text-xs text-slate-400 text-center pt-1">
                      +{semAcaoLista.length - 4} outros
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Atividade recente */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Atividade recente
              </h3>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-500">Follow-ups (14 dias)</span>
                  <span className="text-sm font-bold text-slate-700">{fupRecentes}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-500">Propostas enviadas</span>
                  <span className="text-sm font-bold text-slate-700">
                    {orcamentos.filter((o) => !!o.dataEnvioProposta).length}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-xs text-slate-500">Pendências abertas</span>
                  <span className={`text-sm font-bold ${totalPendenciasAbertas > 0 ? 'text-orange-600' : 'text-slate-700'}`}>
                    {totalPendenciasAbertas}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-slate-500">Valor em propostas</span>
                  <span className="text-sm font-bold text-slate-700">
                    {formatarValor(valorTotal)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
