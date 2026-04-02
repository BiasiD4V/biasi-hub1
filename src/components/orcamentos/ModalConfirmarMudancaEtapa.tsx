import { useState, useRef } from 'react';
import { AlertCircle, Upload, X, Loader2, ShieldAlert } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { EtapaFunil } from '../../domain/value-objects/EtapaFunil';
import { ETAPA_LABELS } from '../../domain/value-objects/EtapaFunil';
import { uploadArquivo } from '../../infrastructure/supabase/storageService';
import type { PapelUsuario } from '../../domain/value-objects/PapelUsuario';

const PAPEIS_APROVADORES: PapelUsuario[] = ['dono', 'admin', 'gestor'];

interface ModalConfirmarMudancaEtapaProps {
  aberto: boolean;
  onFechar: () => void;
  onConfirmar: (observacao: string, arquivoUrl?: string) => void;
  etapaAtual: EtapaFunil;
  etapaNova: EtapaFunil;
  jaExisteTransicao?: boolean;
  papelUsuario?: PapelUsuario;
}

export function ModalConfirmarMudancaEtapa({
  aberto,
  onFechar,
  onConfirmar,
  etapaAtual,
  etapaNova,
  jaExisteTransicao,
  papelUsuario,
}: ModalConfirmarMudancaEtapaProps) {
  const [observacao, setObservacao] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [caminhoRede, setCaminhoRede] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bloqueadoPorDuplicata = !!(jaExisteTransicao && etapaNova === 'proposta_enviada' && papelUsuario && !PAPEIS_APROVADORES.includes(papelUsuario));

  function handleArquivoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setArquivo(file);
    }
  }

  function handleRemoverArquivo() {
    setArquivo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleConfirmar() {
    if (!arquivo && !caminhoRede.trim()) return;

    setEnviando(true);
    try {
      let arquivoUrl: string | undefined;
      const obs = observacao.trim() || undefined;

      if (arquivo) {
        const result = await uploadArquivo(arquivo, 'mudancas-etapa');
        if (result) {
          arquivoUrl = result.url;
        } else {
          alert('Erro ao enviar arquivo. Tente novamente.');
          setEnviando(false);
          return;
        }
      } else if (caminhoRede.trim()) {
        arquivoUrl = caminhoRede.trim();
      }

      onConfirmar(obs || '', arquivoUrl);
      setObservacao('');
      setArquivo(null);
      setCaminhoRede('');
    } finally {
      setEnviando(false);
    }
  }

  function fechar() {
    setObservacao('');
    setArquivo(null);
    setCaminhoRede('');
    onFechar();
  }

  return (
    <Modal
      titulo="Mudar etapa do funil"
      aberto={aberto}
      onFechar={fechar}
      largura="md"
    >
      <div className="px-6 py-5">
        {/* Info de confirmação */}
        <div className="mb-5 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-900">Confirmação</p>
            <p className="text-xs text-blue-700 mt-2">
              Etapa atual: <strong>{ETAPA_LABELS[etapaAtual]}</strong>
            </p>
            <p className="text-xs text-blue-700">
              Nova etapa: <strong className="text-blue-900">{ETAPA_LABELS[etapaNova]}</strong>
            </p>
          </div>
        </div>

        {/* Aviso de transição duplicada */}
        {jaExisteTransicao && (
          <div className={`mb-5 rounded-lg px-4 py-3 flex items-start gap-3 ${bloqueadoPorDuplicata ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
            <ShieldAlert size={18} className={`${bloqueadoPorDuplicata ? 'text-red-600' : 'text-amber-600'} flex-shrink-0 mt-0.5`} />
            <div>
              <p className={`text-sm font-semibold ${bloqueadoPorDuplicata ? 'text-red-900' : 'text-amber-900'}`}>
                {bloqueadoPorDuplicata ? 'Aprovação necessária' : 'Transição já registrada'}
              </p>
              <p className={`text-xs mt-1 ${bloqueadoPorDuplicata ? 'text-red-700' : 'text-amber-700'}`}>
                Já existe uma mudança de <strong>{ETAPA_LABELS[etapaAtual]}</strong> → <strong>{ETAPA_LABELS[etapaNova]}</strong> no histórico.
                {bloqueadoPorDuplicata
                  ? ' Somente Gestor, Admin ou Dono podem reenviar uma Proposta Enviada duplicada.'
                  : ' Tem certeza que deseja registrar novamente?'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Anexar arquivo - OBRIGATÓRIO */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Upload size={14} className="text-red-600" />
              Anexar arquivo ou caminho
              <span className="text-red-600 font-bold">*</span>
            </label>
            
            {arquivo ? (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-green-600">✓</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-green-900 truncate">{arquivo.name}</p>
                    <p className="text-xs text-green-700">
                      {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRemoverArquivo}
                  className="text-green-600 hover:text-green-700 flex-shrink-0"
                  title="Remover arquivo"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-300 bg-blue-50 rounded-lg p-6 hover:bg-blue-100 hover:border-blue-400 transition-all cursor-pointer mb-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleArquivoChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2 text-center">
                  <Upload size={24} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-blue-700">Clique para selecionar</p>
                    <p className="text-xs text-blue-600 mt-1">ou arraste um arquivo</p>
                  </div>
                </div>
              </div>
            )}

            {/* OU separador */}
            <div className="relative mb-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-white text-xs text-slate-400">OU</span>
              </div>
            </div>

            {/* Caminho da rede - obrigatório se não tiver arquivo */}
            <input
              type="text"
              value={caminhoRede}
              onChange={(e) => setCaminhoRede(e.target.value)}
              placeholder="Ex: \\FILESERVER\COMERCIAL\ORC-2024-001"
              disabled={!!arquivo}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:bg-slate-50 mb-2"
            />
            
            {!arquivo && !caminhoRede.trim() && (
              <p className="text-xs text-red-600 font-medium">
                ⚠️ Arquivo ou caminho é obrigatório
              </p>
            )}
          </div>

          {/* Observação adicional */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Observação (opcional)
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Aguardando retorno do cliente..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Botões */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={fechar}
            disabled={enviando}
            className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={(!arquivo && !caminhoRede.trim()) || enviando || bloqueadoPorDuplicata}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {enviando ? 'Enviando...' : 'Confirmar mudança'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
