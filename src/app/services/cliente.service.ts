import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc
} from '@angular/fire/firestore';
import { Cliente } from '../models/cliente.model';
import { traduzirErroFirestore } from '../utils/firestore';
import { EventoService } from './evento.service';

const COLECAO = 'clientes';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private eventoService = inject(EventoService);

  async getAll(): Promise<Cliente[]> {
    const snap = await this.executar(() => getDocs(collection(this.firestore, COLECAO)));
    return snap.docs.map(d => d.data() as Cliente);
  }

  async getById(idCliente: string): Promise<Cliente | undefined> {
    const snap = await this.executar(() => getDoc(doc(this.firestore, COLECAO, idCliente)));
    return snap.exists() ? (snap.data() as Cliente) : undefined;
  }

  async create(dados: Omit<Cliente, 'idCliente'>): Promise<Cliente> {
    // o próprio Firestore gera o id (acaba com o crypto.randomUUID)
    const ref = runInInjectionContext(this.injector, () =>
      doc(collection(this.firestore, COLECAO))
    );
    const novo: Cliente = {
      idCliente: ref.id,
      nomeNoiva: dados.nomeNoiva,
      nomeNoivo: dados.nomeNoivo,
      email: dados.email,
      telefone: dados.telefone
    };
    await this.executar(() => setDoc(ref, novo));
    return novo;
  }

  async update(idCliente: string, dados: Partial<Omit<Cliente, 'idCliente'>>): Promise<void> {
    const ref = runInInjectionContext(this.injector, () =>
      doc(this.firestore, COLECAO, idCliente)
    );
    const snap = await this.executar(() => getDoc(ref));
    if (!snap.exists()) throw new Error('Cliente não encontrado');

    const atual = snap.data() as Cliente;
    const atualizado: Cliente = {
      idCliente,
      nomeNoiva: dados.nomeNoiva ?? atual.nomeNoiva,
      nomeNoivo: dados.nomeNoivo ?? atual.nomeNoivo,
      email: dados.email ?? atual.email,
      telefone: dados.telefone ?? atual.telefone
    };
    await this.executar(() => setDoc(ref, atualizado));
  }

  // cascade: apaga os eventos do cliente primeiro; se algo falhar no meio,
  // sobra um cliente sem eventos (recuperável), e não eventos sem cliente
  async delete(idCliente: string): Promise<void> {
    await this.eventoService.deleteByCliente(idCliente);
    await this.executar(() => deleteDoc(doc(this.firestore, COLECAO, idCliente)));
  }

  private async executar<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await runInInjectionContext(this.injector, fn);
    } catch (e) {
      throw traduzirErroFirestore(e);
    }
  }
}