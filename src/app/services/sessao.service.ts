import { Injectable, computed, inject, signal } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { AuthService } from './auth.service';

export interface UsuarioSessao {
  idUsuario: string; // uid do Firebase
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

  private _usuario = signal<UsuarioSessao | null>(null);
  readonly usuario = this._usuario.asReadonly();
  readonly logado = computed(() => this._usuario() !== null);

  constructor() {
    onAuthStateChanged(this.auth, user => {
      this._usuario.set(user ? mapear(user) : null);
    });
  }

  // o currentUser cobre a janela logo depois do login, antes do evento chegar
  get idUsuario(): string | null {
    return this._usuario()?.idUsuario ?? this.auth.currentUser?.uid ?? null;
  }

  // atualizar o nome (displayName) não dispara o onAuthStateChanged
  sincronizar(): void {
    const u = this.auth.currentUser;
    this._usuario.set(u ? mapear(u) : null);
  }

  sair(): Promise<void> {
    return this.authService.sair();
  }
}