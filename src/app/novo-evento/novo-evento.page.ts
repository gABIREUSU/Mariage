import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonGrid, IonRow, IonCol, IonCard, IonLabel, IonIcon, IonInput,
  IonSelect, IonSelectOption, IonTextarea, IonButton, ToastController, ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  people, calendarOutline, timeOutline, locationOutline, informationCircleOutline,
} from 'ionicons/icons';
import { Cliente } from '../models/cliente.model';
import { ClienteService } from '../services/cliente.service';
import { EventoService } from '../services/evento.service';
import { SessaoService } from '../services/sessao.service';
import { hojeISO } from '../utils/datas';

@Component({
  selector: 'app-novo-evento',
  standalone: true,
  templateUrl: './novo-evento.page.html',
  styleUrls: ['./novo-evento.page.scss'],
  imports: [
    FormsModule, IonContent, IonGrid, IonRow, IonCol, IonCard, IonLabel, IonIcon,
    IonInput, IonSelect, IonSelectOption, IonTextarea, IonButton,
  ],
})
export class NovoEventoPage implements ViewWillEnter {
  private clienteService = inject(ClienteService);
  private eventoService = inject(EventoService);
  private sessao = inject(SessaoService);
  private router = inject(Router);
  private toast = inject(ToastController);

  clientes = signal<Cliente[]>([]);
  carregado = signal(false);
  salvando = signal(false);

  idCliente = '';
  data = '';
  horario = '';
  endereco = '';
  observacao = '';

  readonly hoje = hojeISO();

  constructor() {
    addIcons({ people, calendarOutline, timeOutline, locationOutline, informationCircleOutline });
  }

  async ionViewWillEnter() {
    this.limpar();
    try {
      this.clientes.set(await this.clienteService.getAll());
    } catch {
      await this.avisar('Não foi possível carregar os clientes. O servidor está rodando?');
    } finally {
      this.carregado.set(true);
    }
  }

  get valido(): boolean {
    return !!(this.idCliente && this.data && this.horario && this.endereco.trim());
  }

  async salvar() {
    if (!this.valido || this.salvando()) return;

    const idUsuario = this.sessao.idUsuario;
    if (!idUsuario) {
      await this.router.navigateByUrl('/login');
      return;
    }
    if (this.data < this.hoje) {
      await this.avisar('A data não pode ser no passado');
      return;
    }

    this.salvando.set(true);
    try {
      await this.eventoService.create({
        idCliente: this.idCliente,
        idUsuario,
        data: this.data,
        horario: this.horario,
        endereco: this.endereco.trim(),
        observacao: this.observacao.trim(),
        status: 'agendado',
      });
      await this.avisar('Evento agendado', 'success');
      await this.router.navigateByUrl('/tabs/eventos');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      await this.avisar(
        !msg || msg === 'Failed to fetch'
          ? 'Não foi possível salvar. O servidor está rodando?'
          : msg,
      );
    } finally {
      this.salvando.set(false);
    }
  }

  private limpar() {
    this.idCliente = '';
    this.data = '';
    this.horario = '';
    this.endereco = '';
    this.observacao = '';
  }

  private async avisar(mensagem: string, cor: 'success' | 'danger' = 'danger') {
    const t = await this.toast.create({ message: mensagem, duration: 2500, position: 'top', color: cor });
    await t.present();
  }
}