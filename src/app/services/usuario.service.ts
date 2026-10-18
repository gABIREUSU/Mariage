import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { EventoService } from './evento.service';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';

export const ADMIN_PADRAO = {
  nome: 'Admin',
  email: 'admin@mariage.com',
  senha: 'admin123',
};

const KEY = 'usuarios';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private db = inject(DatabaseService);
  private eventos = inject(EventoService);

  getAll(): Promise<Usuario[]> {
    return this.db.getAll<Usuario>(KEY);
  }

  async getById(idUsuario: string): Promise<Usuario | undefined> {
    return (await this.getAll()).find(u => u.idUsuario === idUsuario);
  }

  async getByEmail(email: string): Promise<Usuario | undefined> {
    const alvo = email.trim().toLowerCase();
    return (await this.getAll()).find(u => u.email.toLowerCase() === alvo);
  }

  async create(dados: Omit<Usuario, 'idUsuario'>): Promise<Usuario> {
    if (await this.getByEmail(dados.email)) {
      throw new Error('E-mail já cadastrado');
    }
    const usuarios = await this.getAll();
    const novo: Usuario = { ...dados, idUsuario: crypto.randomUUID() };
    usuarios.push(novo);
    await this.db.saveAll(KEY, usuarios);
    return novo;
  }

  async update(idUsuario: string, dados: Partial<Omit<Usuario, 'idUsuario'>>): Promise<void> {
    if (dados.email) {
      const existente = await this.getByEmail(dados.email);
      if (existente && existente.idUsuario !== idUsuario) {
        throw new Error('E-mail já cadastrado');
      }
    }
    const usuarios = await this.getAll();
    const i = usuarios.findIndex(u => u.idUsuario === idUsuario);
    if (i === -1) throw new Error('Usuário não encontrado');
    usuarios[i] = { ...usuarios[i], ...dados };
    await this.db.saveAll(KEY, usuarios);
  }

  // restrict: só exclui se não houver eventos sob responsabilidade dele
  async delete(idUsuario: string): Promise<void> {
    const eventos = await this.eventos.getByUsuario(idUsuario);
    if (eventos.length > 0) {
      throw new Error('Reatribua os eventos deste usuário antes de excluí-lo');
    }
    const usuarios = await this.getAll();
    await this.db.saveAll(KEY, usuarios.filter(u => u.idUsuario !== idUsuario));
  }

  // senha em texto puro: aceitável pro trabalho, mas vale citar como limitação
  async login(email: string, senha: string): Promise<Usuario | null> {
    const usuario = await this.getByEmail(email);
    return usuario && usuario.senha === senha ? usuario : null;
  }
}