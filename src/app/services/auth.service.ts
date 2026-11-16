import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  User,
  UserCredential,
  authState,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from '@angular/fire/auth';
import {
  browserPopupRedirectResolver,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private injector = inject(Injector);
  private redirect: Promise<UserCredential | null> | null = null;

  usuarioAtual(): Promise<User | null> {
    return firstValueFrom(this.dentro(() => authState(this.auth)));
  }

  async entrar(email: string, senha: string): Promise<User> {
    const cred = await this.dentro(() =>
      signInWithEmailAndPassword(this.auth, email.trim(), senha)
    );
    return cred.user;
  }

  modoInstalado(): boolean {
    const nav = navigator as Navigator & { standalone?: boolean };
    return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
  }

  async entrarComGoogle(): Promise<User | null> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    if (this.modoInstalado()) {
      await this.dentro(() =>
        signInWithRedirect(this.auth, provider, browserPopupRedirectResolver)
      );
      return null;
    }
    const cred = await this.dentro(() => signInWithPopup(this.auth, provider, browserPopupRedirectResolver));
    return cred.user;
  }

  async cadastrar(nome: string, email: string, senha: string): Promise<User> {
    const cred = await this.dentro(() =>
      createUserWithEmailAndPassword(this.auth, email.trim(), senha)
    );
    try {
      await this.dentro(() => updateProfile(cred.user, { displayName: nome.trim() }));
    } catch {
    }
    return cred.user;
  }

  resultadoRedirect(): Promise<UserCredential | null> {
    if (!this.redirect) {
      this.redirect = this.dentro(() =>
        getRedirectResult(this.auth, browserPopupRedirectResolver)
      );
    }
    return this.redirect;
  }

  prepararPopup(): void {
    this.resultadoRedirect().catch(() => {});
  }

  sair(): Promise<void> {
    return this.dentro(() => signOut(this.auth));
  }

  recuperarSenha(email: string): Promise<void> {
    return this.dentro(() => sendPasswordResetEmail(this.auth, email.trim()));
  }

  popupCancelado(e: unknown): boolean {
    const code = (e as { code?: string })?.code ?? '';
    return code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request';
  }

  mensagemDeErro(e: unknown): string {
    const code = (e as { code?: string })?.code ?? '';
    if (code.startsWith('auth/api-key-not-valid')) {
      return 'Configuração do Firebase inválida. Confira o environment';
    }
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'E-mail ou senha inválidos';
      case 'auth/invalid-email':
        return 'E-mail inválido';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está cadastrado';
      case 'auth/weak-password':
        return 'A senha precisa ter pelo menos 6 caracteres';
      case 'auth/too-many-requests':
        return 'Muitas tentativas. Aguarde um pouco e tente de novo';
      case 'auth/network-request-failed':
        return 'Sem conexão com o Firebase. Verifique a internet';
      case 'auth/user-disabled':
        return 'Esta conta está desativada';
      case 'auth/operation-not-allowed':
        return 'Este método de login não está habilitado no Firebase';
      case 'auth/popup-blocked':
        return 'O navegador bloqueou o popup. Libere popups para este site e tente de novo';
      case 'auth/account-exists-with-different-credential':
        return 'Já existe uma conta com este e-mail usando outro método de login';
      case 'auth/unauthorized-domain':
        return 'Este domínio não está autorizado no Firebase (Authentication > Settings)';
      case 'auth/invalid-api-key':
      case 'auth/configuration-not-found':
        return 'Configuração do Firebase inválida. Confira o environment';
      default: {
        const detalhe = code || (e instanceof Error ? e.message : String(e ?? ''));
        return detalhe
          ? `Não foi possível concluir (${detalhe}). Tente novamente`
          : 'Não foi possível concluir. Tente novamente';
      }
    }
  }

  private dentro<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}
