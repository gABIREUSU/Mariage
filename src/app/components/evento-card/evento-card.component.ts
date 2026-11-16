import { Component, EventEmitter, Output, input } from '@angular/core';
import { IonCard, IonList, IonItem, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { heart } from 'ionicons/icons';
import { Evento } from '../../models/evento.model';
import { EventoView } from '../../utils/evento';
import { dataCurta } from '../../utils/datas';

@Component({
  selector: 'app-evento-card',
  standalone: true,
  imports: [IonCard, IonList, IonItem, IonLabel, IonIcon],
  template: `
    <ion-card class="settings-card">
      <ion-list lines="full" class="ion-no-padding">
        @for (i of itens(); track i.evento.idEvento; let ultimo = $last) {
          <ion-item
            button
            detail="false"
            [lines]="ultimo ? 'none' : 'full'"
            [class.item-cancelado]="i.status === 'cancelado'"
            (click)="abrir.emit(i.evento)">
            <div class="icon-circle" slot="start">
              <ion-icon name="heart"></ion-icon>
            </div>
            <ion-label>
              <h3>{{ i.titulo }}</h3>
              <p>{{ i.evento.endereco }}</p>
              @if (i.responsavel) {
                <p class="item-responsavel">por {{ i.responsavel }}</p>
              }
            </ion-label>
            <div class="item-meta" slot="end">
              <span class="item-hora">{{ i.evento.horario }}</span>
              <span class="item-data">{{ dataCurta(i.evento.data) }}</span>
              @if (i.status === 'concluido') {
                <span class="item-status item-status--concluido">Concluído</span>
              } @else if (i.status === 'cancelado') {
                <span class="item-status item-status--cancelado">Cancelado</span>
              }
            </div>
          </ion-item>
        }
      </ion-list>
    </ion-card>
  `,
  styles: [`
    :host { display: block; }
    .item-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 2px;
      color: var(--app-text-hint);
    }
    .item-hora { font-size: 0.8rem; }
    .item-data { font-size: 0.68rem; }
    .item-status {
      font-size: 0.64rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .item-status--concluido { color: var(--app-status-ok); }
    .item-status--cancelado { color: var(--app-status-cancel); }
    .item-responsavel { font-size: 0.72rem; color: var(--app-text-hint); }
    .item-cancelado h3 { text-decoration: line-through; }
    .item-cancelado h3,
    .item-cancelado p { opacity: 0.6; }
  `],
})
export class EventoCardComponent {
  itens = input.required<EventoView[]>();
  @Output() abrir = new EventEmitter<Evento>();
  dataCurta = dataCurta;
  constructor() { addIcons({ heart }); }
}
