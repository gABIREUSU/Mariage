import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// telas internas: sem login, volta pro /login
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const usuario = await auth.usuarioAtual();
  return usuario ? true : router.createUrlTree(['/login']);
};

// tela de login: quem já está logado vai direto pro app
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const usuario = await auth.usuarioAtual();
  return usuario ? router.createUrlTree(['/tabs/eventos']) : true;
};