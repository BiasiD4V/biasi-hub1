import { GitBranch } from 'lucide-react';
import type { MudancaEtapa } from '../../domain/entities/MudancaEtapa';
import { ETAPA_LABELS, ETAPA_CORES } from '../../domain/value-objects/EtapaFunil';

interface HistoricoEtapasProps {
  mudancas: MudancaEtapa[];
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoricoEtapas({ mudancas }: HistoricoEtapasProps) {
  if (mudancas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Histórico de Etapas
        </h3>
        <p className="text-xs text-slate-400 text-center py-4">Nenhuma mudança registrada.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
        Histórico de Etapas
      </h3>

      <div className="relative">
        {/* Linha conectora */}
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-slate-100" />

        <div className="space-y-4">
          {mudancas.map((m) => {
            const cor = ETAPA_CORES[m.etapaNova];
            return (
              <div key={m.id} className="relative flex gap-3">
                {/* Dot */}
                <div
                  className={`relative z-10 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${cor.bg}`}
                >
                  <GitBranch size={12} className={cor.text} />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    {m.etapaAnterior && (
                      <>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${ETAPA_CORES[m.etapaAnterior].bg} ${ETAPA_CORES[m.etapaAnterior].text}`}
                        >
                          {ETAPA_LABELS[m.etapaAnterior]}
                        </span>
                        <span className="text-slate-400 text-xs">→</span>
                      </>
                    )}
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cor.bg} ${cor.text}`}
                    >
                      {ETAPA_LABELS[m.etapaNova]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{formatarData(m.data)}</span>
                    <span>·</span>
                    <span>{m.responsavel}</span>
                  </div>

                  {m.observacao && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.observacao}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
