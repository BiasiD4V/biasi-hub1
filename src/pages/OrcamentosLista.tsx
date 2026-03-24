import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Search } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { useOrcamentos } from '../context/OrcamentosContext';
import { calcularTotal, formatarMoeda, formatarData } from '../utils/calculos';
import { StatusOrcamento } from '../types';

const STATUS_OPCOES: { value: StatusOrcamento | 'todos'; label: string }[] = [
  { value: 'todos',     label: 'Todos' },
  { value: 'rascunho',  label: 'Rascunho' },
  { value: 'enviado',   label: 'Enviado' },
  { value: 'aprovado',  label: 'Aprovado' },
  { value: 'reprovado', label: 'Reprovado' },
];

export function OrcamentosLista() {
  const { orcamentos } = useOrcamentos();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusOrcamento | 'todos'>('todos');

  const filtrados = orcamentos.filter((o) => {
    const matchBusca =
      o.numero.toLowerCase().includes(busca.toLowerCase()) ||
      o.cliente.nome.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === 'todos' || o.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orçamentos</h1>
          <p className="text-sm text-gray-500 mt-1">{orcamentos.length} orçamento(s) no total</p>
        </div>
        <Link
          to="/orcamentos/novo"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm"
        >
          <PlusCircle size={16} />
          Novo Orçamento
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por número ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPCOES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFiltroStatus(value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                filtroStatus === value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtrados.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-base">Nenhum orçamento encontrado.</p>
            <p className="text-sm mt-1">Tente ajustar os filtros ou{' '}
              <Link to="/orcamentos/novo" className="text-blue-600 hover:underline">criar um novo</Link>.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Número</th>
                <th className="px-6 py-3 text-left">Cliente</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">E-mail</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Valor Total</th>
                <th className="px-6 py-3 text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((orc) => (
                <tr key={orc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-700">{orc.numero}</td>
                  <td className="px-6 py-4 text-gray-800">{orc.cliente.nome}</td>
                  <td className="px-6 py-4 text-gray-500 hidden md:table-cell">{orc.cliente.email}</td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={orc.status} />
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-gray-700">
                    {formatarMoeda(calcularTotal(orc.itens))}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-500">
                    {formatarData(orc.dataCriacao)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
