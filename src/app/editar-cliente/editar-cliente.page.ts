import { Component } from '@angular/core';
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
import { Evento } from '../models/evento.model';
import { ClienteService } from '../services/cliente.service';
import { EventoService } from '../services/evento.service';
import { GoogleAgendaService } from '../services/google-agenda.service';
import { SessaoService } from '../services/sessao.service';
import {
  emailValido,
  formatarTelefone,
  primeiroNome,
  telefoneValido
} from '../utils/contato';
@Component({
  selector: 'app-editar-cliente',
  templateUrl: './editar-cliente.page.html',
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
    private googleAgenda: GoogleAgendaService,
    private sessao: SessaoService,
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
      await this.voltarComAviso('Não foi possível carregar o cliente. Verifique a conexão');
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
    let eventos: Evento[] = [];
    try {
      eventos = await this.eventoService.getByCliente(this.idCliente);
    } catch (e) {
      await this.avisar(this.mensagemDeErro(e, 'Não foi possível verificar os eventos do cliente'));
      return;
    }
    const qtdEventos = eventos.length;
    const meusNoGoogle = eventos.filter(
      e => !!e.googleEventId && e.idUsuario === this.sessao.idUsuario
    );
    const usaGoogle = meusNoGoogle.length > 0 && this.googleAgenda.temGoogleVinculado();
    const aviso = qtdEventos > 0
      ? `Isso também exclui ${qtdEventos === 1 ? '1 evento' : qtdEventos + ' eventos'} deste cliente.`
      : 'Esta ação não pode ser desfeita.';
    const complemento = usaGoogle ? ' Eles também serão removidos do seu Google Agenda.' : '';
    const alerta = await this.alert.create({
      header: 'Excluir cliente',
      message: `Excluir ${this.casalTitulo}? ${aviso}${complemento}`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            const token = usaGoogle
              ? this.googleAgenda.obterToken().then(
                  () => true,
                  (e: unknown) => {
                    if (!this.googleAgenda.cancelado(e)) console.error('Google Agenda:', e);
                    return false;
                  }
                )
              : null;
            void this.confirmarExclusao(eventos, token);
          }
        }
      ]
    });
    await alerta.present();
  }
  private async confirmarExclusao(eventos: Evento[], token: Promise<boolean> | null) {
    this.salvando = true;
    try {
      await this.clienteService.delete(this.idCliente);
    } catch (e) {
      await this.avisar(this.mensagemDeErro(e, 'Não foi possível excluir'));
      this.salvando = false;
      return;
    }

    const eu = this.sessao.idUsuario;
    const noGoogle = eventos.filter(e => !!e.googleEventId);
    const meus = noGoogle.filter(e => e.idUsuario === eu);
    const deOutros = noGoogle.length - meus.length;
    const falhas = meus.length > 0 ? await this.removerDoGoogle(meus, token) : 0;

    const avisos: string[] = [];
    if (falhas > 0) {
      avisos.push(
        falhas === 1
          ? '1 evento não foi removido do seu Google Agenda'
          : `${falhas} eventos não foram removidos do seu Google Agenda`
      );
    }
    if (deOutros > 0) {
      avisos.push(
        deOutros === 1
          ? '1 evento de outro responsável continua no Google Agenda dele'
          : `${deOutros} eventos de outros responsáveis continuam no Google Agenda deles`
      );
    }
    if (avisos.length) {
      await this.avisar(
        `Cliente excluído, mas ${avisos.join('; ')}${this.googleAgenda.dicaConectar()}`,
        'warning'
      );
    } else {
      await this.avisar('Cliente excluído', 'success');
    }
    this.salvando = false;
    await this.router.navigateByUrl('/tabs/clientes');
  }
  private async removerDoGoogle(eventos: Evento[], token: Promise<boolean> | null): Promise<number> {
    if (!token || !(await token)) return eventos.length;
    const resultados = await Promise.all(
      eventos.map(e =>
        this.googleAgenda.apagarEvento(e.googleEventId as string).then(
          () => true,
          (erro: unknown) => {
            console.error('Google Agenda:', erro);
            return false;
          }
        )
      )
    );
    return resultados.filter(ok => !ok).length;
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
      ? `${padrao}. Verifique a conexão e tente de novo`
      : msg;
  }
  private async voltarComAviso(mensagem: string) {
    await this.avisar(mensagem);
    await this.router.navigateByUrl('/tabs/clientes');
  }
  private async avisar(mensagem: string, cor: 'success' | 'danger' | 'warning' = 'danger') {
    const t = await this.toast.create({
      message: mensagem,
      duration: cor === 'warning' ? 4500 : 2500,
      position: 'top',
      color: cor
    });
    await t.present();
  }
}
