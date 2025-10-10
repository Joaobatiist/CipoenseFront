import { UserRole } from '../types';

export const ROUTES = {
  auth: {
    index: '/' as const,
    login: '/login' as const,
  },
  athlete: {
    home: '/atletas/atleta' as const,
    profile: '/atletas/perfil' as const,
  },
  staff: {
    technician: '/funcionarios/tecnico' as const,
  },
  admin: {
    coordinator: '/administrador/coordenador' as const,
    supervisor: '/administrador/supervisor' as const,
  },
  register: {
    athlete: '/cadastro/atleta' as const,
    employee: '/cadastro/funcionario' as const,
    employeeCoordinator: '/cadastro/funcionario-coordenador' as const,
  },
  tasks: {
    aiAnalysis: '/tarefas/analise-ia' as const,
    communication: '/tarefas/comunicado' as const,
    inventory: '/tarefas/controle-estoque' as const,
    lineup: '/tarefas/escalacao' as const,
    generalEvaluation: '/tarefas/avaliacao-geral' as const,
    athletesList: '/tarefas/lista-atletas' as const,
    attendance: '/tarefas/lista-presenca' as const,
    employeesList: '/tarefas/lista-funcionarios' as const,
    reports: '/tarefas/relatorios' as const,
  },
} as const;

export const ROLE_ROUTES: Record<UserRole, string> = {
  ATLETA: ROUTES.athlete.home,
  TECNICO: ROUTES.staff.technician,
  COORDENADOR: ROUTES.admin.coordinator,
  SUPERVISOR: ROUTES.admin.supervisor,
};
