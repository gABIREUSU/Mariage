import { Injectable, computed, signal } from '@angular/core';
import { Usuario } from '../models/usuario.model';

const KEY = 'mariage.sessao';

// só o necessário: a senha NÃO vai pra sessão
interface SessaoSalva {
  idUsuario: string;
  nome: string;
}

@Injectable({ providedIn: 'root' })
export class SessaoService {
  private _usuario = signal<SessaoSalva | null>(this.ler());

  readonly usuario = this._usuario.asReadonly();
  readonly logado = computed(() => this._usuario() !== null);

  get idUsuario(): string | null {
    return this._usuario()?.idUsuario ?? null;
  }

  entrar(u: Usuario): void {
    const dados: SessaoSalva = { idUsuario: u.idUsuario, nome: u.nome };
    this._usuario.set(dados);
    try {
      sessionStorage.setItem(KEY, JSON.stringify(dados));
    } catch {
      // storage indisponível: a sessão vale só enquanto o app estiver aberto
    }
  }

  sair(): void {
    this._usuario.set(null);
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // ignora
    }
  }

  private ler(): SessaoSalva | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as SessaoSalva) : null;
    } catch {
      return null;
    }
  }
}