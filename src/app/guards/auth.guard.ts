import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const usuario = await auth.usuarioAtual();
  return usuario ? true : router.createUrlTree(['/login']);
};
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const usuario = await auth.usuarioAtual();
  return usuario ? router.createUrlTree(['/tabs/eventos']) : true;
};
