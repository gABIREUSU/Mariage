import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  NavController,
  ToastController,
  ViewWillEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  people,
  calendarOutline,
  timeOutline,
  locationOutline,
  informationCircleOutline,
  personCircleOutline
} from 'ionicons/icons';
import { Evento } from '../models/evento.model';
import { Usuario } from '../models/usuario.model';
import { ClienteService } from '../services/cliente.service';
import { EventoService } from '../services/evento.service';
import { GoogleAgendaService } from '../services/google-agenda.service';
import { SessaoService } from '../services/sessao.service';
import { UsuarioService } from '../services/usuario.service';
import { hojeISO } from '../utils/datas';
import { montarViews, statusExibido } from '../utils/evento';

@Component({
  selector: 'app-editar-evento',
  templateUrl: './editar-evento.page.html',
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
export class EditarEventoPage implements ViewWillEnter {
  private route = inject(ActivatedRoute);
  private nav = inject(NavController);
  private toast = inject(ToastController);
  private clienteService = inject(ClienteService);
  private eventoService = inject(EventoService);
  private googleAgenda = inject(GoogleAgendaService);
  private sessao = inject(SessaoService);
  private usuarioService = inject(UsuarioService);

  evento: Evento | null = null;
  titulo: string = '';
  carregado: boolean = false;
  salvando: boolean = false;
  usuarios: Usuario[] = [];
  idUsuario: string = '';
  data: string = '';
  horario: string = '';
  endereco: string = '';
  observacao: string = '';
  hoje: string = hojeISO();

  constructor() {
    addIcons({
      people,
      calendarOutline,
      timeOutline,
      locationOutline,
      informationCircleOutline,
      personCircleOutline
    });
  }

  async ionViewWillEnter() {
    this.carregado = false;
    this.evento = null;
    this.hoje = hojeISO();
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    try {
      const evento = id ? await this.eventoService.getById(id) : undefined;
      if (!evento || statusExibido(evento, this.hoje) !== 'agendado') {
        await this.avisar('Este evento não pode ser editado');
        this.voltar();
        return;
      }
      const [cliente, usuarios] = await Promise.all([
        this.clienteService.getById(evento.idCliente),
        this.usuarioService.getAll().catch(() => [] as Usuario[])
      ]);
      this.titulo = montarViews([evento], cliente ? [cliente] : [])[0].titulo;
      this.usuarios = this.opcoesResponsavel(usuarios, evento.idUsuario);
      this.idUsuario = evento.idUsuario;
      this.evento = evento;
      this.data = evento.data;
      this.horario = evento.horario;
      this.endereco = evento.endereco;
      this.observacao = evento.observacao;
    } catch {
      await this.avisar('Não foi possível carregar o evento. Tente novamente');
      this.voltar();
    } finally {
      this.carregado = true;
    }
  }

  get valido(): boolean {
    return !!(this.evento && this.idUsuario && this.data && this.horario && this.endereco.trim());
  }

  async salvar() {
    const evento = this.evento;
    if (!evento || !this.valido || this.salvando) return;
    if (this.data < this.hoje) {
      void this.avisar('A data não pode ser no passado');
      return;
    }

    const eu = this.sessao.idUsuario;
    const vinculado = this.googleAgenda.temGoogleVinculado();
    const googleId = evento.googleEventId;
    const mudouDono = this.idUsuario !== evento.idUsuario;
    const eraMeu = evento.idUsuario === eu;
    const ficaMeu = this.idUsuario === eu;

    const atualizar = !mudouDono && !!googleId && eraMeu && vinculado;
    const remover = mudouDono && !!googleId && eraMeu && vinculado;
    const criar = mudouDono && ficaMeu && vinculado;

    const tokenGoogle =
      atualizar || remover || criar
        ? this.googleAgenda.obterToken().then(
            () => true,
            (e: unknown) => {
              if (!this.googleAgenda.cancelado(e)) console.error('Google Agenda:', e);
              return false;
            }
          )
        : null;

    this.salvando = true;
    const dados = {
      data: this.data,
      horario: this.horario,
      endereco: this.endereco.trim(),
      observacao: this.observacao.trim()
    };

    try {
      await this.eventoService.update(evento.idEvento, { ...dados, idUsuario: this.idUsuario });
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      await this.avisar(
        !msg || msg === 'Failed to fetch'
          ? 'Não foi possível salvar. Verifique a conexão e tente de novo'
          : msg
      );
      this.salvando = false;
      return;
    }

    const avisos: string[] = [];
    const comToken = tokenGoogle ? await tokenGoogle : false;

    if (!mudouDono && googleId) {
      if (!eraMeu) {
        avisos.push('o Google Agenda do responsável não foi alterado');
      } else if (!atualizar) {
        avisos.push('o Google Agenda não está conectado');
      } else if (!comToken || !(await this.tentar(() =>
        this.googleAgenda.atualizarEvento(googleId, { titulo: this.titulo, ...dados })))) {
        avisos.push('não foi alterado no Google Agenda');
      }
    }

    if (mudouDono && googleId) {
      if (remover) {
        const ok = comToken && (await this.tentar(() => this.googleAgenda.apagarEvento(googleId)));
        if (!ok) avisos.push('não foi removido do seu Google Agenda');
      } else {
        avisos.push(
          eraMeu
            ? 'não foi removido do seu Google Agenda'
            : 'continua no Google Agenda do responsável anterior'
        );
      }
      await this.tentar(() => this.eventoService.definirGoogleEventId(evento.idEvento, null));
    }

    if (criar) {
      const novoId = comToken
        ? await this.googleAgenda
            .criarEvento({ titulo: this.titulo, ...dados })
            .catch((e: unknown) => {
              console.error('Google Agenda:', e);
              return null;
            })
        : null;
      if (!novoId) {
        avisos.push('não foi adicionado ao seu Google Agenda');
      } else if (!(await this.tentar(() =>
        this.eventoService.definirGoogleEventId(evento.idEvento, novoId)))) {
        avisos.push('o vínculo com o Google Agenda não foi salvo');
      }
    }

    if (avisos.length) {
      await this.avisar(
        `Evento atualizado, mas ${avisos.join('; ')}${this.googleAgenda.dicaConectar()}`,
        'warning'
      );
    } else {
      await this.avisar('Evento atualizado', 'success');
    }
    this.salvando = false;
    this.voltar();
  }

  voltar() {
    this.nav.back();
  }

  private async tentar(fn: () => Promise<unknown>): Promise<boolean> {
    try {
      await fn();
      return true;
    } catch (e) {
      console.error('Google Agenda:', e);
      return false;
    }
  }

  private opcoesResponsavel(usuarios: Usuario[], atual: string): Usuario[] {
    const lista = [...usuarios];
    if (!lista.some(u => u.idUsuario === atual)) {
      lista.push({ idUsuario: atual, nome: 'Responsável atual (sem perfil)', email: '' });
    }
    return lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
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
