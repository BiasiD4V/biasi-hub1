import { BarChart2, TrendingUp, Target, DollarSign, Users, Clock } from 'lucide-react';
import { useNovoOrcamento } from '../context/NovoOrcamentoContext';
import { ETAPA_LABELS } from '../domain/value-objects/EtapaFunil';

interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ElementType;
  iconBg: string;
  valueColor?: string;
}

function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  iconBg,
  valueColor = 'text-slate-800',
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        <div className={`${iconBg} rounded-lg p-1.5`}>
          <Icon size={14} className="text-slate-400" />
        </div>
      </div>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
      {sublabel && (
        <p className="text-xs text-slate-400 mt-1">{sublabel}</p>
      )}
    </div>
  );
}

export function Relatorios() {
  const { orcamentos, followUps, pendencias } = useNovoOrcamento();

  // ── Métricas gerais ──────────────────────────────────────────────────
  const total = orcamentos.length;
  const emAndamento = orcamentos.filter(
    (o) => o.resultadoComercial === 'em_andamento'
  ).length;
  const ganhos = orcamentos.filter((o) => o.resultadoComercial === 'ganho').length;
  const perdidos = orcamentos.filter(
    (o) => o.resultadoComercial === 'perdido'
  ).length;
  const fechados = ganhos + perdidos;
  const taxaConversao =
    fechados > 0 ? Math.round((ganhos / fechados) * 100) : 0;

  const valorTotalGanho = orcamentos
    .filter((o) => o.resultadoComercial === 'ganho' && o.valorProposta)
    .reduce((sum, o) => sum + (o.valorProposta ?? 0), 0);

  const valorTotalPipeline = orcamentos
    .filter((o) => o.resultadoComercial === 'em_andamento' && o.valorProposta)
    .reduce((sum, o) => sum + (o.valorProposta ?? 0), 0);

  const totalFollowUps = followUps.length;
  const pendenciasAbertas = pendencias.filter((p) => p.status === 'aberta').length;

  // ── Distribuição por etapa do funil ─────────────────────────────────
  const porEtapa = orcamentos
    .filter((o) => o.resultadoComercial === 'em_andamento')
    .reduce<Record<string, number>>((acc, o) => {
      acc[o.etapaFunil] = (acc[o.etapaFunil] ?? 0) + 1;
      return acc;
    }, {});

  const etapasComContagem = Object.entries(porEtapa)
    .sort(([, a], [, b]) => b - a)
    .map(([etapa, count]) => ({
      etapa,
      label: ETAPA_LABELS[etapa as keyof typeof ETAPA_LABELS] ?? etapa,
      count,
    }));

  const maxEtapa = Math.max(...etapasComContagem.map((e) => e.count), 1);

  // ── Distribuição por responsável ────────────────────────────────────
  const porResponsavel = orcamentos.reduce<
    Record<string, { total: number; ganhos: number; perdidos: number; emAndamento: number }>
  >((acc, o) => {
    const r = o.responsavel || 'Sem responsável';
    if (!acc[r]) acc[r] = { total: 0, ganhos: 0, perdidos: 0, emAndamento: 0 };
    acc[r].total++;
    if (o.resultadoComercial === 'ganho') acc[r].ganhos++;
    else if (o.resultadoComercial === 'perdido') acc[r].perdidos++;
    else acc[r].emAndamento++;
    return acc;
  }, {});

  const responsaveis = Object.entries(porResponsavel)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([nome, stats]) => ({ nome, ...stats }));

  const fmt = (v: number) =>
    v >= 1_000_000
      ? `R$ ${(v / 1_000_000).toFixed(1)}M`
      : v >= 1_000
      ? `R$ ${(v / 1_000).toFixed(0)}k`
      : `R$ ${v.toFixed(0)}`;

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <h1 className="text-2xl font-bold text-slate-800">Relatórios</h1>
        <p className="text-sm text-slate-500 mt-1">
          Análises e indicadores gerenciais do pipeline comercial.
        </p>
      </div>

      {/* Corpo */}
      <div className="flex-1 p-8 overflow-auto space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard
            label="Total de orçamentos"
            value={total}
            icon={BarChart2}
            iconBg="bg-slate-50"
          />
          <MetricCard
            label="Em andamento"
            value={emAndamento}
            icon={Clock}
            iconBg="bg-blue-50"
            valueColor="text-blue-700"
          />
          <MetricCard
            label="Ganhos"
            value={ganhos}
            icon={TrendingUp}
            iconBg="bg-green-50"
            valueColor="text-green-700"
          />
          <MetricCard
            label="Taxa de conversão"
            value={`${taxaConversao}%`}
            sublabel={`${ganhos} ganhos / ${fechados} fechados`}
            icon={Target}
            iconBg="bg-indigo-50"
            valueColor="text-indigo-700"
          />
          <MetricCard
            label="Receita conquistada"
            value={fmt(valorTotalGanho)}
            sublabel="Propostas ganhas"
            icon={DollarSign}
            iconBg="bg-teal-50"
            valueColor="text-teal-700"
          />
          <MetricCard
            label="Pipeline ativo"
            value={fmt(valorTotalPipeline)}
            sublabel="Em andamento"
            icon={DollarSign}
            iconBg="bg-amber-50"
            valueColor="text-amber-700"
          />
        </div>

        {/* Duas colunas: funil + responsáveis */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Distribuição por etapa do funil */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Orçamentos em andamento por etapa do funil
            </h2>
            {etapasComContagem.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                Nenhum orçamento em andamento.
              </p>
            ) : (
              <div className="space-y-3">
                {etapasComContagem.map(({ etapa, label, count }) => (
                  <div key={etapa}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600 truncate max-w-[200px]">
                        {label}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 ml-2">
                        {count}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(count / maxEtapa) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desempenho por responsável */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Desempenho por responsável
            </h2>
            {responsaveis.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                Nenhum dado disponível.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Responsável
                      </th>
                      <th className="text-center pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Total
                      </th>
                      <th className="text-center pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Em andamento
                      </th>
                      <th className="text-center pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Ganhos
                      </th>
                      <th className="text-center pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Perdidos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {responsaveis.map((r) => (
                      <tr key={r.nome} className="hover:bg-slate-50">
                        <td className="py-2.5 text-slate-700 font-medium text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                              <Users size={10} className="text-slate-500" />
                            </div>
                            {r.nome}
                          </div>
                        </td>
                        <td className="py-2.5 text-center text-xs font-semibold text-slate-700">
                          {r.total}
                        </td>
                        <td className="py-2.5 text-center text-xs text-blue-600">
                          {r.emAndamento}
                        </td>
                        <td className="py-2.5 text-center text-xs text-green-600 font-medium">
                          {r.ganhos}
                        </td>
                        <td className="py-2.5 text-center text-xs text-red-500">
                          {r.perdidos}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sumário de atividade */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Resumo de atividade
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">{totalFollowUps}</p>
              <p className="text-xs text-slate-500 mt-1">Follow-ups registrados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{pendenciasAbertas}</p>
              <p className="text-xs text-slate-500 mt-1">Pendências em aberto</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-500">{perdidos}</p>
              <p className="text-xs text-slate-500 mt-1">Orçamentos perdidos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800">
                {total > 0 ? `${Math.round((ganhos / total) * 100)}%` : '0%'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Taxa de ganho (total)</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
