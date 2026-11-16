import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { AuthService } from './auth.service';
import { UsuarioService } from './usuario.service';
export interface UsuarioSessao {
  idUsuario: string;
  nome: string;
  email: string;
}
function mapear(u: User): UsuarioSessao {
  const email = u.email ?? '';
  return {
    idUsuario: u.uid,
    nome: u.displayName || email.split('@')[0] || 'Usuário',
    email
  };
}
@Injectable({ providedIn: 'root' })
export class SessaoService {
  private auth = inject(Auth);
  private authService = inject(AuthService);
  private usuarios = inject(UsuarioService);
  private _usuario = signal<UsuarioSessao | null>(null);
  readonly usuario = this._usuario.asReadonly();
  readonly logado = computed(() => this._usuario() !== null);
  private filaPerfil: Promise<void> = Promise.resolve();
  constructor() {
    onAuthStateChanged(this.auth, user => {
      this.definir(user);
    });
  }
  get idUsuario(): string | null {
    return this._usuario()?.idUsuario ?? this.auth.currentUser?.uid ?? null;
  }
  sincronizar(): void {
    this.definir(this.auth.currentUser);
  }
  sair(): Promise<void> {
    return this.authService.sair();
  }

  private definir(user: User | null): void {
    const sessao = user ? mapear(user) : null;
    this._usuario.set(sessao);
    if (sessao && sessao.email) {
      this.filaPerfil = this.filaPerfil
        .then(() => this.usuarios.salvarPerfil(sessao))
        .catch(e => {
          console.error('Não foi possível salvar o perfil:', e);
        });
    }
  }
}
