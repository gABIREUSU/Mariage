import { Injectable, signal } from '@angular/core';

const CHAVE = 'mariage-tema';

@Injectable({ providedIn: 'root' })
export class TemaService {
  readonly escuro = signal(this.inicial());

  constructor() {
    this.aplicar(this.escuro());
  }

  definir(escuro: boolean): void {
    this.escuro.set(escuro);
    this.aplicar(escuro);
    try {
      localStorage.setItem(CHAVE, escuro ? 'escuro' : 'claro');
    } catch {}
  }

  private inicial(): boolean {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) return salvo === 'escuro';
    } catch {}
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  private aplicar(escuro: boolean): void {
    document.documentElement.classList.toggle('dark', escuro);
    const cor = escuro ? '#121212' : '#efefef';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', cor);
  }
}
