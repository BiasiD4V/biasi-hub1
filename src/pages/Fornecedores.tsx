import { Truck } from 'lucide-react';
import { PaginaPlaceholder } from '../components/ui/PaginaPlaceholder';

export function Fornecedores() {
  return (
    <PaginaPlaceholder
      titulo="Fornecedores"
      subtitulo="Cadastro e gestão de fornecedores e parceiros."
      icone={Truck}
      descricao="Cadastro de fornecedores, cotações vinculadas, avaliações e histórico de fornecimento por insumo."
    />
  );
}
