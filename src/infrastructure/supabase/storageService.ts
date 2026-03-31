/**
 * Serviço de armazenamento de arquivos
 * 
 * Faz upload para Supabase Storage via API serverless do Vercel.
 * Arquivos ficam na nuvem, acessíveis de qualquer dispositivo.
 */

/**
 * Faz upload de um arquivo para o Supabase Storage via API proxy.
 */
export async function uploadArquivo(
  file: File,
  pasta: string
): Promise<{ url: string; nome: string } | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pasta', pasta);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Erro no upload:', err);
      return null;
    }

    const data = await response.json();
    return { url: data.url, nome: data.nome };
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    return null;
  }
}

/**
 * Abre um arquivo a partir da URL.
 */
export async function abrirArquivo(ref: string): Promise<void> {
  if (ref.startsWith('http')) {
    window.open(ref, '_blank', 'noopener');
    return;
  }

  // Fallback para referências antigas (idb: ou nome simples)
  alert(`Arquivo "${nomeArquivo(ref)}" não está disponível na nuvem. Faça upload novamente.`);
}

/**
 * Extrai o nome legível de uma referência de arquivo.
 */
export function nomeArquivo(ref: string): string {
  if (ref.startsWith('idb:')) {
    const parts = ref.split('|');
    return parts[1] || parts[0].split('/').pop() || 'Arquivo';
  }
  if (ref.startsWith('http')) {
    const fileName = ref.split('/').pop() || 'Arquivo';
    // Remove timestamp prefix (e.g., "1234567890_nome.pdf" → "nome.pdf")
    const withoutTimestamp = fileName.replace(/^\d+_/, '');
    return decodeURIComponent(withoutTimestamp);
  }
  return ref.split('/').pop() || ref;
}
