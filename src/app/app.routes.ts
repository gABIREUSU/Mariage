import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        // vem antes de 'eventos' e começa com o nome da aba: a barra continua
        // visível e a aba Eventos continua destacada
        path: 'eventos/novo',
        loadComponent: () => import('./novo-evento/novo-evento.page').then(m => m.NovoEventoPage),
      },
      {
        path: 'eventos',
        pathMatch: 'full',
        loadComponent: () => import('./eventos/eventos.page').then(m => m.EventosPage),
      },
      {
        // TODO (quem fizer Clientes): trocar o redirect por
        // loadComponent: () => import('./clientes/clientes.page').then(m => m.ClientesPage)
        path: 'clientes',
        redirectTo: '/tabs/eventos',
        pathMatch: 'full',
      },
      {
        path: 'calendario',
        loadComponent: () => import('./calendario/calendario.page').then(m => m.CalendarioPage),
      },
      {
        path: 'configuracoes',
        loadComponent: () =>
          import('./configuracoes/configuracoes.page').then(m => m.ConfiguracoesPage),
      },
      { path: '', redirectTo: '/tabs/eventos', pathMatch: 'full' },
    ],
  },
  // compatibilidade com qualquer navegação antiga
  { path: 'configuracoes', redirectTo: '/tabs/configuracoes', pathMatch: 'full' },  {
    path: 'novo-evento',
    loadComponent: () => import('./novo-evento/novo-evento.page').then( m => m.NovoEventoPage)
  },

];