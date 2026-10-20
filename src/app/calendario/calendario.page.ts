import { Component, computed, inject, signal } from '@angular/core';
import {
  IonContent, IonGrid, IonRow, IonCol, IonCard, IonDatetime, ViewWillEnter,
} from '@ionic/angular/standalone';
import { Evento } from '../models/evento.model';
import { EventoService } from '../services/evento.service';
import { ClienteService } from '../services/cliente.service';
import { EventoCardComponent } from '../components/evento-card/evento-card.component';
import { hojeISO } from '../utils/datas';
import { EventoView, montarViews } from '../utils/evento';

@Component({
  selector: 'app-calendario',
  standalone: true,
  templateUrl: './calendario.page.html',
  styleUrls: ['./calendario.page.scss'],
  imports: [IonContent, IonGrid, IonRow, IonCol, IonCard, IonDatetime, EventoCardComponent],
})
export class CalendarioPage implements ViewWillEnter {
  private eventoService = inject(EventoService);
  private clienteService = inject(ClienteService);

  itens = signal<EventoView[]>([]);
  carregado = signal(false);
  selecionada = signal<string | null>(null);

  private datasComEvento = computed(() => new Set(this.itens().map(v => v.evento.data)));
  
  destacar = (iso: string) =>
    this.datasComEvento().has(iso.slice(0, 10))
      ? { textColor: '#1c1c1c', backgroundColor: '#d6d7d9' }
      : undefined;

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
    const [eventos, clientes] = await Promise.all([
      this.eventoService.getAll(),
      this.clienteService.getAll(),
    ]);
    this.itens.set(montarViews(eventos, clientes));
    this.carregado.set(true);
  }

  selecionar(valor: string | string[] | null | undefined) {
    const v = Array.isArray(valor) ? valor[0] : valor;
    this.selecionada.set(v ? v.slice(0, 10) : null);
  }

  // TODO: navegar pra edição do evento quando a tela existir
  abrir(_evento: Evento) {}
}