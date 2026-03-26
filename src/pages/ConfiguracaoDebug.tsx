import { useEffect, useState } from 'react';
import { supabase } from '../infrastructure/supabase/client';

export function ConfiguracaoDebug() {
  const [status, setStatus] = useState('Verificando...');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const verificar = async () => {
      try {
        console.log('🔍 Iniciando verificação de configuração...');

        // 1. Verificar conexão com Supabase
        console.log('1️⃣ Verificando URL e chave...');