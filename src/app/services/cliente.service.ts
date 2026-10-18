import { Injectable, inject } from '@angular/core';
import { DatabaseService } from './database.service';
import { EventoService } from './evento.service';
import { Cliente } from '../models/cliente.model';

const KEY = 'clientes';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private db = inject(DatabaseService);
  private eventos = inject(EventoService);

  getAll(): Promise<Cliente[]> {
    return this.db.getAll<Cliente>(KEY);
  }

  async getById(idCliente: string): Promise<Cliente | undefined> {
    return (await this.getAll()).find(c => c.idCliente === idCliente);
  }

  async create(dados: Omit<Cliente, 'idCliente'>): Promise<Cliente> {
    const clientes = await this.getAll();
    const novo: Cliente = { ...dados, idCliente: crypto.randomUUID() };
    clientes.push(novo);
    await this.db.saveAll(KEY, clientes);
    return novo;
  }

  async update(idCliente: string, dados: Partial<Omit<Cliente, 'idCliente'>>): Promise<void> {
    const clientes = await this.getAll();
    const i = clientes.findIndex(c => c.idCliente === idCliente);
    if (i === -1) throw new Error('Cliente não encontrado');
    clientes[i] = { ...clientes[i], ...dados };
    await this.db.saveAll(KEY, clientes);
  }

  // cascade: apaga os eventos do cliente antes de apagar o cliente
  async delete(idCliente: string): Promise<void> {
    await this.eventos.deleteByCliente(idCliente);
    const clientes = await this.getAll();
    await this.db.saveAll(KEY, clientes.filter(c => c.idCliente !== idCliente));
  }
}