import { FileText, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CardResumo } from '../components/CardResumo';
import { StatusBadge } from '../components/StatusBadge';
import { useOrcamentos } from '../context/OrcamentosContext';
import { calcularTotal, formatarMoeda, formatarData } from '../utils/calculos';

export function Dashboard() {
  const { orcamentos } = useOrcamentos();

  const total = orcamentos.length;
  const valorTotal = orcamentos.reduce((acc, o) => acc + calcularTotal(o.itens), 0);
  const aprovados = orcamentos.filter((o) => o.status === 'aprovado').length;
  const pendentes = orcamentos.filter((o) => o.status === 'enviado' || o.status === 'rascunho').length;

  const recentes = [...orcamentos].slice(0, 5);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral dos orçamentos</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <CardResumo
          titulo="Total de Orçamentos"
          valor={total}
          Icon={FileText}
          corIcone="text-blue-600"
          corFundo="bg-blue-50"
        />
        <CardResumo
          titulo="Valor Total"
          valor={formatarMoeda(valorTotal)}
          Icon={DollarSign}
          corIcone="text-emerald-600"
          corFundo="bg-emerald-50"
        />
        <CardResumo
          titulo="Aprovados"
          valor={aprovados}
          Icon={CheckCircle}
          corIcone="text-green-600"
          corFundo="bg-green-50"
        />
        <CardResumo
          titulo="Pendentes"
          valor={pendentes}
          Icon={Clock}
          corIcone="text-amber-600"
          corFundo="bg-amber-50"
        />
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Orçamentos Recentes</h2>
          <Link
            to="/orcamentos"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            Ver todos →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Número</th>
                <th className="px-6 py-3 text-left">Cliente</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Valor Total</th>
                <th className="px-6 py-3 text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentes.map((orc) => (
                <tr key={orc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-700">{orc.numero}</td>
                  <td className="px-6 py-4 text-gray-600">{orc.cliente.nome}</td>
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
        </div>
      </div>
    </div>
  );
}
