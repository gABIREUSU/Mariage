import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import { Firestore, collection, doc, getDoc, getDocs, setDoc } from '@angular/fire/firestore';
import { Usuario } from '../models/usuario.model';
import { traduzirErroFirestore } from '../utils/firestore';

const COLECAO = 'usuarios';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  async getAll(): Promise<Usuario[]> {
    const snap = await this.executar(() => getDocs(collection(this.firestore, COLECAO)));
    return snap.docs.map(d => d.data() as Usuario);
  }

  async getById(idUsuario: string): Promise<Usuario | undefined> {
    const snap = await this.executar(() => getDoc(doc(this.firestore, COLECAO, idUsuario)));
    return snap.exists() ? (snap.data() as Usuario) : undefined;
  }

  async salvarPerfil(usuario: Usuario): Promise<void> {
    const perfil: Usuario = {
      idUsuario: usuario.idUsuario,
      nome: usuario.nome.trim().slice(0, 120) || 'Usuário',
      email: usuario.email.trim().slice(0, 160)
    };
    const atual = await this.getById(perfil.idUsuario);
    if (atual && atual.nome === perfil.nome && atual.email === perfil.email) return;
    await this.executar(() => setDoc(doc(this.firestore, COLECAO, perfil.idUsuario), perfil));
  }

  private async executar<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await runInInjectionContext(this.injector, fn);
    } catch (e) {
      throw traduzirErroFirestore(e);
    }
  }
}
