import type { Usuario } from '../../../domain/entities/Usuario';

export const mockUsuarios: Usuario[] = [
  { id: 'u1', nome: 'Admin Biasi', email: 'admin@biasi.com.br', papel: 'admin', ativo: true, departamento: 'Administração' },
  { id: 'u2', nome: 'Carlos Gestor', email: 'carlos@biasi.com.br', papel: 'gestor', ativo: true, departamento: 'Comercial' },
  { id: 'u3', nome: 'Ana Orçamentista', email: 'ana@biasi.com.br', papel: 'orcamentista', ativo: true, departamento: 'Engenharia' },
  { id: 'u4', nome: 'Pedro Orçamentista', email: 'pedro@biasi.com.br', papel: 'orcamentista', ativo: true, departamento: 'Engenharia' },
];
