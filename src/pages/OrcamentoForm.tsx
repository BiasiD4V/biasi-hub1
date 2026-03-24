import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, CheckCircle } from 'lucide-react';
import { TabelaItens } from '../components/TabelaItens';
import { useOrcamentos } from '../context/OrcamentosContext';
import { mockClientes } from '../infrastructure/mock/dados/clientes.mock';
import { mockCatalogo } from '../infrastructure/mock/dados/catalogo.mock';
import { calcularTotal, calcularTotalComDesconto, formatarMoeda } from '../utils/calculos';
import { ItemOrcamento, Orcamento } from '../types';

function gerarId() {
  return Math.random().toString(36).slice(2, 9);
}

function gerarNumero(total: number) {
  const ano = new Date().getFullYear();
  const seq = String(total + 1).padStart(3, '0');
  return `ORC-${ano}-${seq}`;
}

export function OrcamentoForm() {
  const navigate = useNavigate();
  const { orcamentos, addOrcamento } = useOrcamentos();

  const [clienteId, setClienteId] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [itens, setItens] = useState<ItemOrcamento[]>([]);
  const [catalogoSelecionado, setCatalogoSelecionado] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  function adicionarItem() {
    if (!catalogoSelecionado) return;
    const base = mockCatalogo[Number(catalogoSelecionado)];
    const novoItem: ItemOrcamento = {
      id: gerarId(),
      descricao: base.descricao,
      unidade: base.unidade,
      valorUnitario: base.valorUnitario,
      quantidade: 1,
    };
    setItens((prev) => [...prev, novoItem]);
    setCatalogoSelecionado('');
  }

  function removerItem(id: string) {
    setItens((prev) => prev.filter((i) => i.id !== id));
  }

  function atualizarItem(id: string, campo: 'quantidade' | 'valorUnitario', valor: number) {
    setItens((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [campo]: valor } : i))
    );
  }

  function salvar() {
    if (!clienteId) {
      setErro('Selecione um cliente para continuar.');
      return;
    }
    if (itens.length === 0) {
      setErro('Adicione ao menos um item ao orçamento.');
      return;
    }

    const clienteRaw = mockClientes.find((c) => c.id === clienteId)!;
    const cliente = {
      id: clienteRaw.id,
      nome: clienteRaw.nomeFantasia ?? clienteRaw.razaoSocial,
      email: clienteRaw.email ?? '',
      telefone: clienteRaw.telefone ?? '',
    };
    const novoOrcamento: Orcamento = {
      id: gerarId(),
      numero: gerarNumero(orcamentos.length),
      cliente,
      itens,
      status: 'rascunho',
      dataCriacao: new Date().toISOString().split('T')[0],
      observacoes,
    };

    addOrcamento(novoOrcamento);
    setErro('');
    setSucesso(true);

    setTimeout(() => {
      navigate('/orcamentos');
    }, 1800);
  }

  const totalBruto = calcularTotal(itens);
  const totalFinal = calcularTotalComDesconto(itens, desconto);

  if (sucesso) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle size={40} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Orçamento salvo com sucesso!</h2>
          <p className="text-gray-500 mt-2 text-sm">Redirecionando para a lista...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Novo Orçamento</h1>
        <p className="text-sm text-gray-500 mt-1">Preencha os dados e adicione os itens</p>
      </div>

      {/* Erro */}
      {erro && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {erro}
        </div>
      )}

      {/* Dados do Cliente */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Dados do Cliente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Cliente <span className="text-red-500">*</span>
            </label>
            <select
              value={clienteId}
              onChange={(e) => { setClienteId(e.target.value); setErro(''); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Selecione um cliente...</option>
              {mockClientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nomeFantasia ?? c.razaoSocial}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Observações</label>
            <input
              type="text"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: reforma do galpão 3..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">Itens do Orçamento</h2>

        {/* Add Item */}
        <div className="flex gap-3 mb-4">
          <select
            value={catalogoSelecionado}
            onChange={(e) => setCatalogoSelecionado(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Selecionar item do catálogo...</option>
            {mockCatalogo.map((item, idx) => (
              <option key={idx} value={idx}>
                {item.descricao} — {formatarMoeda(item.valorUnitario)}/{item.unidade}
              </option>
            ))}
          </select>
          <button
            onClick={adicionarItem}
            disabled={!catalogoSelecionado}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <PlusCircle size={16} />
            Adicionar
          </button>
        </div>

        <TabelaItens itens={itens} onRemover={removerItem} onAtualizar={atualizarItem} />
      </div>

      {/* Totais */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-gray-700 mb-4">Resumo</h2>
        <div className="space-y-3 max-w-xs ml-auto text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatarMoeda(totalBruto)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <label className="flex items-center gap-2">
              Desconto (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={desconto}
              onChange={(e) => setDesconto(Number(e.target.value))}
              className="w-20 text-right border border-gray-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-between font-semibold text-base text-gray-800 border-t border-gray-100 pt-3">
            <span>Total</span>
            <span className="text-blue-700">{formatarMoeda(totalFinal)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => navigate('/orcamentos')}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={salvar}
          className="px-6 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
        >
          Salvar Orçamento
        </button>
      </div>
    </div>
  );
}
