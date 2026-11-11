import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
  writeBatch
} from '@angular/fire/firestore';
import { Evento } from '../models/evento.model';
import { traduzirErroFirestore } from '../utils/firestore';
const EVENTOS = 'eventos';
const AGENDA = 'agenda';
const TAM_LOTE = 200;
const MSG_DATA_OCUPADA = 'Já existe um evento nesta data';
interface Trava {
  data: string;
  idEvento: string;
}
const ocupaData = (e: Evento) => e.status !== 'cancelado';
@Injectable({ providedIn: 'root' })
export class EventoService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  async getAll(): Promise<Evento[]> {
    const snap = await this.executar(() => getDocs(collection(this.firestore, EVENTOS)));
    return snap.docs.map(d => d.data() as Evento);
  }
  async getById(idEvento: string): Promise<Evento | undefined> {
    const snap = await this.executar(() => getDoc(doc(this.firestore, EVENTOS, idEvento)));
    return snap.exists() ? (snap.data() as Evento) : undefined;
  }
  async getByCliente(idCliente: string): Promise<Evento[]> {
    const snap = await this.executar(() =>
      getDocs(query(collection(this.firestore, EVENTOS), where('idCliente', '==', idCliente)))
    );
    return snap.docs.map(d => d.data() as Evento);
  }
  async getByUsuario(idUsuario: string): Promise<Evento[]> {
    const snap = await this.executar(() =>
      getDocs(query(collection(this.firestore, EVENTOS), where('idUsuario', '==', idUsuario)))
    );
    return snap.docs.map(d => d.data() as Evento);
  }
  async create(dados: Omit<Evento, 'idEvento'>): Promise<Evento> {
    const eventoRef = this.dentro(() => doc(collection(this.firestore, EVENTOS)));
    const novo: Evento = {
      idEvento: eventoRef.id,
      idCliente: dados.idCliente,
      idUsuario: dados.idUsuario,
      data: dados.data,
      horario: dados.horario,
      endereco: dados.endereco,
      observacao: dados.observacao ?? '',
      status: dados.status
    };
    await this.executar(() =>
      runTransaction(this.firestore, async tx => {
        if (ocupaData(novo)) {
          const travaRef = this.ref(AGENDA, novo.data);
          const trava = await tx.get(travaRef);
          if (trava.exists()) throw new Error(MSG_DATA_OCUPADA);
          tx.set(travaRef, { data: novo.data, idEvento: novo.idEvento } as Trava);
        }
        tx.set(eventoRef, novo);
      })
    );
    return novo;
  }
  async update(idEvento: string, dados: Partial<Omit<Evento, 'idEvento'>>): Promise<void> {
    const eventoRef = this.ref(EVENTOS, idEvento);
    await this.executar(() =>
      runTransaction(this.firestore, async tx => {
        const snap = await tx.get(eventoRef);
        if (!snap.exists()) throw new Error('Evento não encontrado');
        const atual = snap.data() as Evento;
        const novo: Evento = {
          idEvento,
          idCliente: dados.idCliente ?? atual.idCliente,
          idUsuario: dados.idUsuario ?? atual.idUsuario,
          data: dados.data ?? atual.data,
          horario: dados.horario ?? atual.horario,
          endereco: dados.endereco ?? atual.endereco,
          observacao: dados.observacao ?? atual.observacao,
          status: dados.status ?? atual.status
        };
        const ocupavaAntes = ocupaData(atual);
        const ocupaDepois = ocupaData(novo);
        const mudouData = atual.data !== novo.data;
        const travaAntesRef = this.ref(AGENDA, atual.data);
        const travaDepoisRef = this.ref(AGENDA, novo.data);
        const travaAntes = ocupavaAntes ? await tx.get(travaAntesRef) : null;
        const travaDepois = !ocupaDepois
          ? null
          : mudouData
            ? await tx.get(travaDepoisRef)
            : (travaAntes ?? (await tx.get(travaDepoisRef)));
        if (
          ocupaDepois &&
          travaDepois?.exists() &&
          (travaDepois.data() as Trava).idEvento !== idEvento
        ) {
          throw new Error(MSG_DATA_OCUPADA);
        }
        if (
          ocupavaAntes &&
          (mudouData || !ocupaDepois) &&
          travaAntes?.exists() &&
          (travaAntes.data() as Trava).idEvento === idEvento
        ) {
          tx.delete(travaAntesRef);
        }
        if (ocupaDepois && !travaDepois?.exists()) {
          tx.set(travaDepoisRef, { data: novo.data, idEvento } as Trava);
        }
        tx.set(eventoRef, novo);
      })
    );
  }
  async delete(idEvento: string): Promise<void> {
    const eventoRef = this.ref(EVENTOS, idEvento);
    await this.executar(() =>
      runTransaction(this.firestore, async tx => {
        const snap = await tx.get(eventoRef);
        if (!snap.exists()) return;
        const evento = snap.data() as Evento;
        const travaRef = this.ref(AGENDA, evento.data);
        const trava = ocupaData(evento) ? await tx.get(travaRef) : null;
        if (trava?.exists() && (trava.data() as Trava).idEvento === idEvento) {
          tx.delete(travaRef);
        }
        tx.delete(eventoRef);
      })
    );
  }
  async deleteByCliente(idCliente: string): Promise<void> {
    const eventos = await this.getByCliente(idCliente);
    if (eventos.length === 0) return;
    const datasParaLiberar = await Promise.all(
      eventos.map(async e => {
        if (!ocupaData(e)) return null;
        const trava = await this.executar(() => getDoc(doc(this.firestore, AGENDA, e.data)));
        return trava.exists() && (trava.data() as Trava).idEvento === e.idEvento ? e.data : null;
      })
    );
    for (let i = 0; i < eventos.length; i += TAM_LOTE) {
      const lote = this.dentro(() => writeBatch(this.firestore));
      eventos.slice(i, i + TAM_LOTE).forEach((e, j) => {
        lote.delete(this.ref(EVENTOS, e.idEvento));
        const data = datasParaLiberar[i + j];
        if (data) lote.delete(this.ref(AGENDA, data));
      });
      await this.executar(() => lote.commit());
    }
  }
  async reatribuirResponsavel(idUsuarioAtual: string, idUsuarioNovo: string): Promise<void> {
    const eventos = await this.getByUsuario(idUsuarioAtual);
    for (let i = 0; i < eventos.length; i += TAM_LOTE) {
      const lote = this.dentro(() => writeBatch(this.firestore));
      for (const e of eventos.slice(i, i + TAM_LOTE)) {
        lote.update(this.ref(EVENTOS, e.idEvento), { idUsuario: idUsuarioNovo });
      }
      await this.executar(() => lote.commit());
    }
  }
  private ref(colecao: string, id: string) {
    return this.dentro(() => doc(this.firestore, colecao, id));
  }
  private dentro<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
  private async executar<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await this.dentro(fn);
    } catch (e) {
      throw traduzirErroFirestore(e);
    }
  }
}
