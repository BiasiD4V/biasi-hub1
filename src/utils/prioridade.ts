import type { OrcamentoCard } from '../context/NovoOrcamentoContext';

export type Prioridade = 'alta' | 'media' | 'baixa';

/**
 * Calcula a prioridade de ação comercial de forma simples e prática.
 * Retorna null quando o caso já está fechado (ganho/perdido).
 */
export function calcularPrioridade(orc: OrcamentoCard): Prioridade | null {
  if (orc.resultadoComercial !== 'em_andamento') return null;

  const hoje = new Date();

  const acaoVencida =
    !!orc.dataProximaAcao &&
    !!orc.proximaAcao &&
    new Date(orc.dataProximaAcao + 'T23:59:59') < hoje;

  const semAcao = !orc.proximaAcao;

  const diasSemInteracao =
    (hoje.getTime() - new Date(orc.ultimaInteracao).getTime()) / (1000 * 60 * 60 * 24);

  const estrategico = orc.clienteEstrategico === 'sim';
  const chanceAlta = orc.chanceFechamento === 'alta';
  const urgenciaAlta = orc.urgencia === 'alta';

  // ── ALTA ──────────────────────────────────────────────────────────────
  // Ação vencida é sempre crítico
  if (acaoVencida) return 'alta';
  // Sem ação em caso estratégico ou com alta chance: age rápido
  if (semAcao && (estrategico || chanceAlta)) return 'alta';
  // Chance alta + urgência alta: oportunidade quente, não pode esperar
  if (chanceAlta && urgenciaAlta) return 'alta';

  // ── MÉDIA ─────────────────────────────────────────────────────────────
  // Sem próxima ação definida
  if (semAcao) return 'media';
  // Pendências em aberto bloqueando avanço
  if (orc.pendenciasAbertas > 0) return 'media';
  // Sem interação há mais de 14 dias
  if (diasSemInteracao > 14) return 'media';

  // ── BAIXA ─────────────────────────────────────────────────────────────
  return 'baixa';
}

export const PRIORIDADE_CONFIG: Record<
  Prioridade,
  { label: string; bg: string; text: string; dot: string }
> = {
  alta: {
    label: 'Alta',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
  media: {
    label: 'Média',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
  },
  baixa: {
    label: 'Baixa',
    bg: 'bg-slate-50',
    text: 'text-slate-500',
    dot: 'bg-slate-300',
  },
};
