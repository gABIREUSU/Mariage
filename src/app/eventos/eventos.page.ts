import { Component, computed, inject, signal } from '@angular/core';
import {
  IonContent, IonGrid, IonRow, IonCol, IonButton, IonIcon, IonSearchbar, IonChip, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add } from 'ionicons/icons';
import { Evento } from '../models/evento.model';
import { EventoService } from '../services/evento.service';
import { ClienteService } from '../services/cliente.service';
import { EventoCardComponent } from '../components/evento-card/evento-card.component';
import { normalizar, rotuloMes } from '../utils/datas';
import { EventoView, montarViews } from '../utils/evento';
import { Router } from '@angular/router';

type Filtro = 'todos' | Evento['status'];

@Component({
  selector: 'app-eventos',
  standalone: true,
  templateUrl: './eventos.page.html',
  styleUrls: ['./eventos.page.scss'],
  imports: [
    IonContent, IonGrid, IonRow, IonCol, IonButton, IonIcon, IonSearchbar, IonChip,
    EventoCardComponent,
  ],
})
export class EventosPage implements ViewWillEnter {
  private router = inject(Router);
  private eventoService = inject(EventoService);
  private clienteService = inject(ClienteService);

  readonly filtros: { valor: Filtro; rotulo: string }[] = [
    { valor: 'todos', rotulo: 'Todos' },
    { valor: 'agendado', rotulo: 'Agendados' },
    { valor: 'concluido', rotulo: 'Concluídos' },
    { valor: 'cancelado', rotulo: 'Cancelados' },
  ];

  itens = signal<EventoView[]>([]);
  busca = signal('');
  filtro = signal<Filtro>('todos');

  grupos = computed(() => {
    const termo = normalizar(this.busca());
    const f = this.filtro();

    const filtrados = this.itens()
      .filter(v => f === 'todos' || v.evento.status === f)
      .filter(v =>
        !termo || normalizar(`${v.titulo} ${v.nomes} ${v.evento.endereco}`).includes(termo))
      .sort((a, b) =>
        (a.evento.data + a.evento.horario).localeCompare(b.evento.data + b.evento.horario));

    const porMes = new Map<string, EventoView[]>();
    for (const v of filtrados) {
      const chave = v.evento.data.slice(0, 7);
      porMes.set(chave, [...(porMes.get(chave) ?? []), v]);
    }
    return [...porMes].map(([chave, itens]) => ({ rotulo: rotuloMes(chave), itens }));
  });

  constructor() { addIcons({ add }); }

  async ionViewWillEnter() {
    const [eventos, clientes] = await Promise.all([
      this.eventoService.getAll(),
      this.clienteService.getAll(),
    ]);
    this.itens.set(montarViews(eventos, clientes));
  }

  novo() {
    this.router.navigateByUrl('/tabs/eventos/novo');
  }

  // TODO: navegar pra edição do evento quando a tela existir
  abrir(_evento: Evento) {}
}