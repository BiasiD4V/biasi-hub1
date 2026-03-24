import { StatusOrcamento } from '../types';

const config: Record<StatusOrcamento, { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-gray-100 text-gray-600' },
  enviado:  { label: 'Enviado',  className: 'bg-blue-100 text-blue-700' },
  aprovado: { label: 'Aprovado', className: 'bg-green-100 text-green-700' },
  reprovado:{ label: 'Reprovado',className: 'bg-red-100 text-red-700' },
};

interface Props {
  status: StatusOrcamento;
}

export function StatusBadge({ status }: Props) {
  const { label, className } = config[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
