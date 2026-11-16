import { Component, inject } from '@angular/core';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonToggle,
  AlertController,
  NavController,
  ToastController,
  ViewWillEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircle,
  moon,
  calendar,
  checkmarkCircle,
  logOutOutline,
  chevronForwardOutline
} from 'ionicons/icons';
import { SessaoService } from '../services/sessao.service';
import { GoogleAgendaService } from '../services/google-agenda.service';
import { TemaService } from '../services/tema.service';

@Component({
  selector: 'app-configuracoes',
  templateUrl: './configuracoes.page.html',
  standalone: true,
  imports: [
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonToggle
  ]
})
export class ConfiguracoesPage implements ViewWillEnter {
  private sessao = inject(SessaoService);
  private nav = inject(NavController);
  private alert = inject(AlertController);
  private toast = inject(ToastController);
  private googleAgenda = inject(GoogleAgendaService);
  readonly tema = inject(TemaService);
  readonly usuario = this.sessao.usuario;
  saindo = false;
  conectando = false;

  constructor() {
    addIcons({ personCircle, moon, calendar, checkmarkCircle, logOutOutline, chevronForwardOutline });
  }

  async ionViewWillEnter() {
    try {
      if (await this.googleAgenda.concluirRedirect()) {
        await this.avisar('Google Agenda conectado', 'success');
      }
    } catch (e) {
      if (!this.googleAgenda.cancelado(e)) {
        await this.avisar(this.googleAgenda.mensagemDeErro(e));
      }
    }
  }

  get conectado(): boolean {
    return this.googleAgenda.temToken();
  }

  async conectarGoogleAgenda() {
    if (this.conectando) return;
    this.conectando = true;
    try {
      if (this.googleAgenda.usaRedirect() && !this.googleAgenda.temToken()) {
        await this.googleAgenda.conectarPorRedirect();
        return;
      }
      await this.googleAgenda.verificarAcesso();
      await this.avisar('Google Agenda conectado', 'success');
    } catch (e) {
      if (!this.googleAgenda.cancelado(e)) {
        await this.avisar(this.googleAgenda.mensagemDeErro(e));
      }
    } finally {
      this.conectando = false;
    }
  }

  async sairDaConta() {
    if (this.saindo) return;
    const alerta = await this.alert.create({
      header: 'Sair da conta',
      message: 'Você precisará entrar novamente para acessar o app.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sair',
          role: 'destructive',
          handler: () => { void this.confirmarSaida(); }
        }
      ]
    });
    await alerta.present();
  }

  private async confirmarSaida() {
    this.saindo = true;
    try {
      await this.sessao.sair();
      await this.nav.navigateRoot('/login');
    } catch {
      await this.avisar('Não foi possível sair. Tente novamente');
    } finally {
      this.saindo = false;
    }
  }

  private async avisar(mensagem: string, cor: 'success' | 'danger' = 'danger') {
    const t = await this.toast.create({
      message: mensagem,
      duration: 3000,
      position: 'top',
      color: cor
    });
    await t.present();
  }
}
