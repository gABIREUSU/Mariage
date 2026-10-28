import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
{
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'eventos/novo',
        loadComponent: () => import('./novo-evento/novo-evento.page').then(m => m.NovoEventoPage),
      },
      {
        path: 'eventos',
        pathMatch: 'full',
        loadComponent: () => import('./eventos/eventos.page').then(m => m.EventosPage),
      },
      {
        path: 'clientes/novo',
        loadComponent: () => import('./novo-cliente/novo-cliente.page').then(m => m.NovoClientePage),
      },
      {
        path: 'clientes/editar/:id',
        loadComponent: () => import('./editar-cliente/editar-cliente.page').then(m => m.EditarClientePage),
      },
      {
        path: 'clientes',
        pathMatch: 'full',
        loadComponent: () => import('./clientes/clientes.page').then(m => m.ClientesPage),
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

  // compatibilidade com navegações antigas
  { path: 'configuracoes', redirectTo: '/tabs/configuracoes', pathMatch: 'full' },
  { path: 'novo-evento', redirectTo: '/tabs/eventos/novo', pathMatch: 'full' },
  { path: 'novo-cliente', redirectTo: '/tabs/clientes/novo', pathMatch: 'full' },
  { path: 'editar-cliente', redirectTo: '/tabs/clientes', pathMatch: 'full' },
  { path: 'clientes', redirectTo: '/tabs/clientes', pathMatch: 'full' },
];