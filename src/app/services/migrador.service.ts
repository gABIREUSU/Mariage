import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Firestore, doc, runTransaction, setDoc } from '@angular/fire/firestore';
import { Cliente } from '../models/cliente.model';
import { Evento } from '../models/evento.model';
import { DatabaseService } from './database.service';
export interface ResultadoMigracao {
  total: number;
  gravados: number;
  falhas: { id: string; motivo: string }[];
}
@Injectable({ providedIn: 'root' })
export class MigradorService {
  private db = inject(DatabaseService);
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  async migrarClientes(): Promise<ResultadoMigracao> {
    const antigos = await this.db.getAll<Cliente>('clientes');
    const resultado: ResultadoMigracao = { total: antigos.length, gravados: 0, falhas: [] };
    for (const c of antigos) {
      try {
        const limpo: Cliente = {
          idCliente: c.idCliente,
          nomeNoiva: c.nomeNoiva,
          nomeNoivo: c.nomeNoivo,
          email: c.email,
          telefone: c.telefone
        };
        await runInInjectionContext(this.injector, () =>
          setDoc(doc(this.firestore, 'clientes', c.idCliente), limpo)
        );
        resultado.gravados++;
      } catch (e) {
        resultado.falhas.push({
          id: c.idCliente,
          motivo: e instanceof Error ? e.message : String(e)
        });
      }
    }
    return resultado;
  }
  async migrarEventos(): Promise<ResultadoMigracao> {
    const antigos = await this.db.getAll<Evento>('eventos');
    const resultado: ResultadoMigracao = { total: antigos.length, gravados: 0, falhas: [] };
    for (const e of antigos) {
      try {
        const limpo: Evento = {
          idEvento: e.idEvento,
          idCliente: e.idCliente,
          idUsuario: e.idUsuario,
          data: e.data,
          horario: e.horario,
          endereco: e.endereco,
          observacao: e.observacao ?? '',
          status: e.status
        };
        await runInInjectionContext(this.injector, () =>
          runTransaction(this.firestore, async tx => {
            const eventoRef = this.ref('eventos', limpo.idEvento);
            if (limpo.status !== 'cancelado') {
              const travaRef = this.ref('agenda', limpo.data);
              const trava = await tx.get(travaRef);
              if (trava.exists()) {
                const dono = (trava.data() as { idEvento: string }).idEvento;
                if (dono !== limpo.idEvento) {
                  throw new Error(`a data ${limpo.data} já está ocupada pelo evento ${dono}`);
                }
              } else {
                tx.set(travaRef, { data: limpo.data, idEvento: limpo.idEvento });
              }
            }
            tx.set(eventoRef, limpo);
          })
        );
        resultado.gravados++;
      } catch (err) {
        resultado.falhas.push({
          id: e.idEvento,
          motivo: err instanceof Error ? err.message : String(err)
        });
      }
    }
    return resultado;
  }
  private ref(colecao: string, id: string) {
    return runInInjectionContext(this.injector, () => doc(this.firestore, colecao, id));
  }
}
