import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { Evento } from '../models/evento.model';

const KEY = 'eventos';

@Injectable({ providedIn: 'root' })
export class EventoService {
  private db = inject(DatabaseService);

  getAll(): Promise<Evento[]> {
    return this.db.getAll<Evento>(KEY);
  }

  async getById(idEvento: string): Promise<Evento | undefined> {
    return (await this.getAll()).find(e => e.idEvento === idEvento);
  }

  async getByCliente(idCliente: string): Promise<Evento[]> {
    return (await this.getAll()).filter(e => e.idCliente === idCliente);
  }

  async getByUsuario(idUsuario: string): Promise<Evento[]> {
    return (await this.getAll()).filter(e => e.idUsuario === idUsuario);
  }

  async create(dados: Omit<Evento, 'idEvento'>): Promise<Evento> {
    const eventos = await this.getAll();
    const novo: Evento = { ...dados, idEvento: crypto.randomUUID() };
    eventos.push(novo);
    await this.db.saveAll(KEY, eventos);
    return novo;
  }

  async update(idEvento: string, dados: Partial<Omit<Evento, 'idEvento'>>): Promise<void> {
    const eventos = await this.getAll();
    const i = eventos.findIndex(e => e.idEvento === idEvento);
    if (i === -1) throw new Error('Evento não encontrado');
    eventos[i] = { ...eventos[i], ...dados };
    await this.db.saveAll(KEY, eventos);
  }

  async delete(idEvento: string): Promise<void> {
    const eventos = await this.getAll();
    await this.db.saveAll(KEY, eventos.filter(e => e.idEvento !== idEvento));
  }

  // cascade: chamado ao excluir um cliente
  async deleteByCliente(idCliente: string): Promise<void> {
    const eventos = await this.getAll();
    await this.db.saveAll(KEY, eventos.filter(e => e.idCliente !== idCliente));
  }

  // usado pela futura tela de reatribuição
  async reatribuirResponsavel(idUsuarioAtual: string, idUsuarioNovo: string): Promise<void> {
    const eventos = await this.getAll();
    const atualizados = eventos.map(e =>
      e.idUsuario === idUsuarioAtual ? { ...e, idUsuario: idUsuarioNovo } : e
    );
    await this.db.saveAll(KEY, atualizados);
  }
}