import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
  AlertController,
  ToastController,
  ViewWillEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, mailOutline, logoWhatsapp, trashOutline } from 'ionicons/icons';
import { Cliente } from '../models/cliente.model';
import { ClienteService } from '../services/cliente.service';
import { EventoService } from '../services/evento.service';
import {
  emailValido,
  formatarTelefone,
  primeiroNome,
  telefoneValido
} from '../utils/contato';

@Component({
  selector: 'app-editar-cliente',
  templateUrl: './editar-cliente.page.html',
  styleUrls: ['./editar-cliente.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
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
    IonButton
  ]
})
export class EditarClientePage implements ViewWillEnter {

  idCliente: string = '';
  casalTitulo: string = '';
  nomeNoiva: string = '';
  nomeNoivo: string = '';
  emailPrincipal: string = '';
  telefoneWhatsapp: string = '';

  carregando: boolean = true;
  salvando: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private eventoService: EventoService,
    private toast: ToastController,
    private alert: AlertController
  ) {
    addIcons({ personOutline, mailOutline, logoWhatsapp, trashOutline });
  }

  async ionViewWillEnter() {
    this.carregando = true;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      await this.voltarComAviso('Cliente não informado');
      return;
    }

    try {
      const cliente = await this.clienteService.getById(id);
      if (!cliente) {
        await this.voltarComAviso('Cliente não encontrado');
        return;
      }
      this.preencher(cliente);
    } catch {
      await this.voltarComAviso('Não foi possível carregar o cliente. O servidor está rodando?');
      return;
    } finally {
      this.carregando = false;
    }
  }

  aoDigitarTelefone(ev: Event) {
    const campo = ev.target as HTMLInputElement;
    const formatado = formatarTelefone(String(campo.value ?? ''));
    this.telefoneWhatsapp = formatado;
    campo.value = formatado;
  }

  async salvarAlteracoes() {
    if (this.salvando || this.carregando) return;

    const nomeNoiva = this.nomeNoiva.trim();
    const nomeNoivo = this.nomeNoivo.trim();
    const email = this.emailPrincipal.trim();

    if (!nomeNoiva || !nomeNoivo) {
      await this.avisar('Informe o nome da noiva e do noivo');
      return;
    }
    if (!emailValido(email)) {
      await this.avisar('Informe um e-mail válido');
      return;
    }
    if (!telefoneValido(this.telefoneWhatsapp)) {
      await this.avisar('Informe o telefone com DDD');
      return;
    }

    this.salvando = true;
    try {
      await this.clienteService.update(this.idCliente, {
        nomeNoiva,
        nomeNoivo,
        email,
        telefone: this.telefoneWhatsapp
      });
      await this.avisar('Alterações salvas', 'success');
      await this.router.navigateByUrl('/tabs/clientes');
    } catch (e) {
      await this.avisar(this.mensagemDeErro(e, 'Não foi possível salvar'));
    } finally {
      this.salvando = false;
    }
  }

  async excluirCliente() {
    if (this.salvando || this.carregando) return;

    let qtdEventos = 0;
    try {
      qtdEventos = (await this.eventoService.getByCliente(this.idCliente)).length;
    } catch (e) {
      await this.avisar(this.mensagemDeErro(e, 'Não foi possível verificar os eventos do cliente'));
      return;
    }

    const aviso = qtdEventos > 0
      ? `Isso também exclui ${qtdEventos === 1 ? '1 evento' : qtdEventos + ' eventos'} deste cliente.`
      : 'Esta ação não pode ser desfeita.';

    const alerta = await this.alert.create({
      header: 'Excluir cliente',
      message: `Excluir ${this.casalTitulo}? ${aviso}`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => { void this.confirmarExclusao(); }
        }
      ]
    });
    await alerta.present();
  }

  private async confirmarExclusao() {
    this.salvando = true;
    try {
      await this.clienteService.delete(this.idCliente);
      await this.avisar('Cliente excluído', 'success');
      await this.router.navigateByUrl('/tabs/clientes');
    } catch (e) {
      await this.avisar(this.mensagemDeErro(e, 'Não foi possível excluir'));
    } finally {
      this.salvando = false;
    }
  }

  private preencher(c: Cliente) {
    this.idCliente = c.idCliente;
    this.nomeNoiva = c.nomeNoiva;
    this.nomeNoivo = c.nomeNoivo;
    this.emailPrincipal = c.email;
    this.telefoneWhatsapp = c.telefone;
    this.casalTitulo = `${primeiroNome(c.nomeNoiva)} & ${primeiroNome(c.nomeNoivo)}`;
  }

  private mensagemDeErro(e: unknown, padrao: string): string {
    const msg = e instanceof Error ? e.message : '';
    return !msg || msg === 'Failed to fetch'
      ? `${padrao}. O servidor está rodando?`
      : msg;
  }

  private async voltarComAviso(mensagem: string) {
    await this.avisar(mensagem);
    await this.router.navigateByUrl('/tabs/clientes');
  }

  private async avisar(mensagem: string, cor: 'success' | 'danger' = 'danger') {
    const t = await this.toast.create({
      message: mensagem,
      duration: 2500,
      position: 'top',
      color: cor
    });
    await t.present();
  }

}