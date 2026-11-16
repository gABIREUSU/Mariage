import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonLabel,
  IonInput,
  IonIcon,
  IonButton,
  IonSelect,
  IonSelectOption,
  ToastController,
  ViewWillEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  people,
  calendarOutline,
  timeOutline,
  locationOutline,
  informationCircleOutline
} from 'ionicons/icons';
import { Cliente } from '../models/cliente.model';
import { Evento } from '../models/evento.model';
import { ClienteService } from '../services/cliente.service';
import { EventoService } from '../services/evento.service';
import { GoogleAgendaService } from '../services/google-agenda.service';
import { SessaoService } from '../services/sessao.service';
import { primeiroNome } from '../utils/contato';
import { hojeISO } from '../utils/datas';

@Component({
  selector: 'app-novo-evento',
  templateUrl: './novo-evento.page.html',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonLabel,
    IonInput,
    IonIcon,
    IonButton,
    IonSelect,
    IonSelectOption
  ]
})
export class NovoEventoPage implements ViewWillEnter {
  clientes: Cliente[] = [];
  carregado: boolean = false;
  salvando: boolean = false;
  idCliente: string = '';
  data: string = '';
  horario: string = '';
  endereco: string = '';
  observacao: string = '';
  readonly hoje: string = hojeISO();

  constructor(
    private router: Router,
    private clienteService: ClienteService,
    private eventoService: EventoService,
    private googleAgenda: GoogleAgendaService,
    private sessao: SessaoService,
    private toast: ToastController
  ) {
    addIcons({
      people,
      calendarOutline,
      timeOutline,
      locationOutline,
      informationCircleOutline
    });
  }

  async ionViewWillEnter() {
    this.limpar();
    try {
      this.clientes = await this.clienteService.getAll();
    } catch {
      await this.avisar('Não foi possível carregar os clientes. Tente novamente');
    } finally {
      this.carregado = true;
    }
  }

  get valido(): boolean {
    return !!(this.idCliente && this.data && this.horario && this.endereco.trim());
  }

  async agendarEvento() {
    if (!this.valido || this.salvando) return;
    const idUsuario = this.sessao.idUsuario;
    if (!idUsuario) {
      await this.router.navigateByUrl('/login');
      return;
    }
    if (this.data < this.hoje) {
      await this.avisar('A data não pode ser no passado');
      return;
    }
    this.salvando = true;

    const tokenGoogle = this.googleAgenda.temGoogleVinculado()
      ? this.googleAgenda.obterToken().then(
          () => true,
          (e: unknown) => {
            if (!this.googleAgenda.cancelado(e)) console.error('Google Agenda:', e);
            return false;
          }
        )
      : null;

    const dados: Omit<Evento, 'idEvento'> = {
      idCliente: this.idCliente,
      idUsuario,
      data: this.data,
      horario: this.horario,
      endereco: this.endereco.trim(),
      observacao: this.observacao.trim(),
      status: 'agendado'
    };

    try {
      const criado = await this.eventoService.create(dados);
      const noGoogle = tokenGoogle ? await this.enviarParaGoogle(tokenGoogle, criado) : 'ok';
      if (noGoogle === 'falhou') {
        await this.avisar(
          `Evento agendado, mas não foi adicionado ao Google Agenda${this.googleAgenda.dicaConectar()}`,
          'warning'
        );
      } else if (noGoogle === 'sem-vinculo') {
        await this.avisar(
          'Evento agendado e adicionado ao Google Agenda, mas o vínculo não foi salvo. Alterações no app não chegarão lá',
          'warning'
        );
      } else {
        await this.avisar('Evento agendado', 'success');
      }
      await this.router.navigateByUrl('/tabs/eventos');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      await this.avisar(
        !msg || msg === 'Failed to fetch'
          ? 'Não foi possível salvar. Verifique a conexão e tente de novo'
          : msg
      );
    } finally {
      this.salvando = false;
    }
  }

  private async enviarParaGoogle(
    token: Promise<boolean>,
    evento: Evento
  ): Promise<'ok' | 'falhou' | 'sem-vinculo'> {
    if (!(await token)) return 'falhou';
    const cliente = this.clientes.find(c => c.idCliente === evento.idCliente);
    const titulo = cliente
      ? `Casamento de ${primeiroNome(cliente.nomeNoiva)} & ${primeiroNome(cliente.nomeNoivo)}`
      : 'Casamento';

    let idGoogle: string;
    try {
      idGoogle = await this.googleAgenda.criarEvento({
        titulo,
        data: evento.data,
        horario: evento.horario,
        endereco: evento.endereco,
        observacao: evento.observacao
      });
    } catch (e) {
      console.error('Google Agenda:', e);
      return 'falhou';
    }

    try {
      await this.eventoService.definirGoogleEventId(evento.idEvento, idGoogle);
    } catch (e) {
      console.error('Não foi possível gravar o googleEventId:', e);
      return 'sem-vinculo';
    }
    return 'ok';
  }

  private limpar() {
    this.idCliente = '';
    this.data = '';
    this.horario = '';
    this.endereco = '';
    this.observacao = '';
  }

  private async avisar(
    mensagem: string,
    cor: 'success' | 'danger' | 'warning' = 'danger'
  ) {
    const t = await this.toast.create({
      message: mensagem,
      duration: cor === 'warning' ? 4500 : 2500,
      position: 'top',
      color: cor
    });
    await t.present();
  }
}
