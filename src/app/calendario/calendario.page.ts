import { Component, computed, inject, signal } from '@angular/core';
import {
  IonContent, IonGrid, IonRow, IonCol, IonCard, IonDatetime, ViewWillEnter,
} from '@ionic/angular/standalone';
import { Evento } from '../models/evento.model';
import { EventoService } from '../services/evento.service';
import { ClienteService } from '../services/cliente.service';
import { UsuarioService } from '../services/usuario.service';
import { AcoesEventoService } from '../services/acoes-evento.service';
import { EventoCardComponent } from '../components/evento-card/evento-card.component';
import { hojeISO } from '../utils/datas';
import { EventoView, montarViews } from '../utils/evento';

@Component({
  selector: 'app-calendario',
  standalone: true,
  templateUrl: './calendario.page.html',
  imports: [IonContent, IonGrid, IonRow, IonCol, IonCard, IonDatetime, EventoCardComponent],
})
export class CalendarioPage implements ViewWillEnter {
  private eventoService = inject(EventoService);
  private clienteService = inject(ClienteService);
  private usuarioService = inject(UsuarioService);
  private acoes = inject(AcoesEventoService);

  itens = signal<EventoView[]>([]);
  carregado = signal(false);
  selecionada = signal<string | null>(null);

  private datasComEvento = computed(
    () => new Set(
      this.itens()
        .filter(v => v.evento.status !== 'cancelado')
        .map(v => v.evento.data)
    )
  );

  destacar = computed(() => {
    const datas = this.datasComEvento();
    return (iso: string) =>
      datas.has(iso.slice(0, 10))
        ? { textColor: 'var(--app-cal-hl-text)', backgroundColor: 'var(--app-cal-hl-bg)' }
        : undefined;
  });

  titulo = computed(() => {
    const sel = this.selecionada();
    return sel ? `Eventos de ${sel.split('-').reverse().join('/')}` : 'Próximos Eventos';
  });

  lista = computed(() => {
    const sel = this.selecionada();
    const ativos = this.itens().filter(v => v.evento.status !== 'cancelado');
    const base = sel
      ? ativos.filter(v => v.evento.data === sel)
      : ativos.filter(v => v.evento.data >= hojeISO());
    return base
      .sort((a, b) =>
        (a.evento.data + a.evento.horario).localeCompare(b.evento.data + b.evento.horario))
      .slice(0, sel ? undefined : 5);
  });

  async ionViewWillEnter() {
    await this.carregar();
    this.carregado.set(true);
  }

  selecionar(valor: string | string[] | null | undefined) {
    const v = Array.isArray(valor) ? valor[0] : valor;
    this.selecionada.set(v ? v.slice(0, 10) : null);
  }

  async abrir(evento: Evento) {
    const view = this.itens().find(v => v.evento.idEvento === evento.idEvento);
    const mudou = await this.acoes.abrir(evento, view?.titulo ?? 'Casamento');
    if (mudou) await this.carregar();
  }

  private async carregar() {
    const [eventos, clientes, usuarios] = await Promise.all([
      this.eventoService.getAll(),
      this.clienteService.getAll(),
      this.usuarioService.getAll().catch(() => []),
    ]);
    this.itens.set(montarViews(eventos, clientes, usuarios));
  }
}
