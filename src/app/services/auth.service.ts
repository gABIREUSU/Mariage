import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import {
  Auth,
  User,
  authState,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private injector = inject(Injector);

  // Espera o Firebase restaurar a sessão (importante no F5) e devolve o usuário ou null
  usuarioAtual(): Promise<User | null> {
    return firstValueFrom(this.dentro(() => authState(this.auth)));
  }

  async entrar(email: string, senha: string): Promise<User> {
    const cred = await this.dentro(() =>
      signInWithEmailAndPassword(this.auth, email.trim(), senha)
    );
    return cred.user;
  }

  async cadastrar(nome: string, email: string, senha: string): Promise<User> {
    const cred = await this.dentro(() =>
      createUserWithEmailAndPassword(this.auth, email.trim(), senha)
    );
    try {
      await this.dentro(() => updateProfile(cred.user, { displayName: nome.trim() }));
    } catch {
      // a conta já foi criada; sem nome, a sessão usa o início do e-mail
    }
    return cred.user;
  }

  sair(): Promise<void> {
    return this.dentro(() => signOut(this.auth));
  }

  recuperarSenha(email: string): Promise<void> {
    return this.dentro(() => sendPasswordResetEmail(this.auth, email.trim()));
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
        return 'Login por e-mail e senha não está habilitado no Firebase';
      case 'auth/invalid-api-key':
      case 'auth/configuration-not-found':
        return 'Configuração do Firebase inválida. Confira o environment';
      default:
        return 'Não foi possível concluir. Tente novamente';
    }
  }

  private dentro<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}