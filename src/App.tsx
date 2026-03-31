import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';

// Providers
import { AuthProvider } from './context/AuthContext';
import { CadastrosMestresProvider } from './context/CadastrosMestresContext';
import { ClientesProvider } from './context/ClientesContext';
import { NovoOrcamentoProvider } from './context/NovoOrcamentoContext';

// Layout autenticado
import { LayoutAutenticado } from './components/layout/LayoutAutenticado';
import { RedirectToDashboard } from './components/RedirectToDashboard';

// Páginas públicas
import { Login } from './pages/Login';
import { ConfiguracaoDebug } from './pages/ConfiguracaoDebug';
import { ConfiguradorUUIDs } from './pages/ConfiguradorUUIDs';

// Páginas autenticadas
import { DashboardNovo } from './pages/DashboardNovo';
import { Configuracoes } from './pages/Configuracoes';
import { OrcamentosNovos } from './pages/OrcamentosNovos';
import { OrcamentosKanban } from './pages/OrcamentosKanban';
import { OrcamentoDetalhe } from './pages/OrcamentoDetalhe';
import { Clientes } from './pages/Clientes';
import { Fornecedores } from './pages/Fornecedores';
import { Insumos } from './pages/Insumos';
import { Composicoes } from './pages/Composicoes';
import { Templates } from './pages/Templates';
import { Aprovacoes } from './pages/Aprovacoes';
import { Relatorios } from './pages/Relatorios';
import { Propostas } from './pages/Propostas';
import { MaoDeObra } from './pages/MaoDeObra';
import { InclusoExcluso } from './pages/InclusoExcluso';
import { MeusDispositivos } from './pages/MeusDispositivos';

function AutoLoginSetupCheck() {
  const [status, setStatus] = useState<'loading' | 'done'>('loading');

  useEffect(() => {
    // Executar setup do auto-login automaticamente
    const setupAutoLogin = async () => {
      try {
        const { supabase } = await import('./infrastructure/supabase/client');
        
        console.log('🔄 Configurando auto-login...');
        
        // Chamar função RPC que faz toda a setup
        const { data, error } = await supabase.rpc('setup_auto_login');

        if (error) {
          console.warn('⚠️  Setup parcial:', error.message);
          // Mesmo com erro, marcamos como feito para não ficar tentando sempre
        } else if (data?.success) {
          console.log('✅ Auto-login configurado:', data.message);
        }
        
        // Marcar como feito (não mostrar mais)
        localStorage.setItem('auto_login_setup_done', 'true');
        setStatus('done');
      } catch (e) {
        console.error('Erro no setup:', e);
        localStorage.setItem('auto_login_setup_done', 'true');
        setStatus('done');
      }
    };

    // Só fazer setup uma vez
    if (!localStorage.getItem('auto_login_setup_done')) {
      setupAutoLogin();
    } else {
      setStatus('done');
    }
  }, []);

  // Não renderiza nada, apenas roda silenciosamente
  return null;
}

export function App() {
  return (
    <AuthProvider>
      <CadastrosMestresProvider>
          <ClientesProvider>
          <NovoOrcamentoProvider>
            <AutoLoginSetupCheck />
            <BrowserRouter>
              <Routes>
                {/* Rota pública */}
                <Route path="/login" element={<Login />} />
                <Route path="/debug" element={<ConfiguracaoDebug />} />
                <Route path="/setup-uuids" element={<ConfiguradorUUIDs />} />

                {/* Raiz → redireciona baseado na autenticação */}
                <Route path="/" element={<RedirectToDashboard />} />

                {/* Rotas autenticadas — verificação feita no LayoutAutenticado */}
                <Route element={<LayoutAutenticado />}>
                  <Route path="/dashboard" element={<DashboardNovo />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                  <Route path="/orcamentos" element={<OrcamentosNovos />} />
                  <Route path="/orcamentos/kanban" element={<OrcamentosKanban />} />
                  <Route path="/orcamentos/:id" element={<OrcamentoDetalhe />} />
                  <Route path="/clientes" element={<Clientes />} />
                  <Route path="/fornecedores" element={<Fornecedores />} />
                  <Route path="/insumos" element={<Insumos />} />
                  <Route path="/composicoes" element={<Composicoes />} />
                  <Route path="/templates" element={<Templates />} />
                  <Route path="/mao-de-obra" element={<MaoDeObra />} />
                  <Route path="/incluso-excluso" element={<InclusoExcluso />} />
                  <Route path="/aprovacoes" element={<Aprovacoes />} />
                  <Route path="/relatorios" element={<Relatorios />} />
                  <Route path="/operacao/orcamentos" element={<Propostas />} />
                  <Route path="/meus-dispositivos" element={<MeusDispositivos />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
          </NovoOrcamentoProvider>
          </ClientesProvider>
        </CadastrosMestresProvider>
    </AuthProvider>
  );
}
