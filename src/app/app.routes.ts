import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'eventos',
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
        loadComponent: () => import('./configuracoes/configuracoes.page').then(m => m.ConfiguracoesPage),
      },
      { path: '', redirectTo: '/tabs/eventos', pathMatch: 'full' },
    ],
  },
  // compatibilidade com qualquer navegação antiga
  { path: 'configuracoes', redirectTo: '/tabs/configuracoes', pathMatch: 'full' },
  {
    path: 'eventos',
    loadComponent: () => import('./eventos/eventos.page').then( m => m.EventosPage)
  },
  {
    path: 'calendario',
    loadComponent: () => import('./calendario/calendario.page').then( m => m.CalendarioPage)
  },

];