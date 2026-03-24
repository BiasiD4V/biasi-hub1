import type { QualificacaoOportunidade } from '../../../domain/value-objects/QualificacaoOportunidade';

export const mockQualificacoes: QualificacaoOportunidade[] = [
  {
    orcamentoId: 'orc1',
    fitTecnico: 'alto',
    clarezaDocumentos: 'alta',
    urgencia: 'alta',
    chanceFechamento: 'alta',
    clienteEstrategico: 'sim',
    prazoResposta: '2024-01-25',
    observacaoComercial:
      'Cliente âncora — histórico de contratos recorrentes. Prioridade máxima.',
    atualizadoEm: '2024-01-12T10:30:00Z',
  },
  {
    orcamentoId: 'orc2',
    fitTecnico: 'medio',
    clarezaDocumentos: 'media',
    urgencia: 'baixa',
    chanceFechamento: 'media',
    clienteEstrategico: 'nao',
    prazoResposta: '2024-02-15',
    observacaoComercial:
      'Cliente novo — aguardando visita técnica para confirmar escopo hidrossanitário.',
    atualizadoEm: '2024-01-20T11:00:00Z',
  },
  {
    orcamentoId: 'orc3',
    fitTecnico: 'alto',
    clarezaDocumentos: 'baixa',
    urgencia: 'alta',
    chanceFechamento: 'media',
    clienteEstrategico: 'sim',
    prazoResposta: '2026-03-20',
    observacaoComercial:
      'Projeto estratégico — cliente aguarda resposta, mas documentação técnica ainda incompleta. Solicitar plantas atualizadas com urgência.',
    atualizadoEm: '2026-03-10T08:00:00Z',
  },
  {
    orcamentoId: 'orc4',
    fitTecnico: 'baixo',
    clarezaDocumentos: 'media',
    urgencia: 'baixa',
    chanceFechamento: 'baixa',
    clienteEstrategico: 'nao',
    observacaoComercial:
      'Oportunidade em estágio inicial. Fit técnico baixo — escopo de CFTV fora da especialidade principal.',
    atualizadoEm: '2026-02-20T09:00:00Z',
  },
];
