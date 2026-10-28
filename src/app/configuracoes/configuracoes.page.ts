import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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
  IonFooter,
  IonToolbar,
  AlertController,
  NavController,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircle,
  lockClosed,
  notifications,
  calendar,
  camera,
  person,
  helpOutline,
  logOutOutline,
  chevronForwardOutline,
  listOutline,
  settings
} from 'ionicons/icons';
import { SessaoService } from '../services/sessao.service';

@Component({
  selector: 'app-configuracoes',
  templateUrl: './configuracoes.page.html',
  styleUrls: ['./configuracoes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonFooter,
    IonToolbar
  ]
})
export class ConfiguracoesPage {

  private sessao = inject(SessaoService);
  private nav = inject(NavController);
  private alert = inject(AlertController);
  private toast = inject(ToastController);

  saindo: boolean = false;

  constructor(private router: Router) {
    addIcons({
      personCircle,
      lockClosed,
      notifications,
      calendar,
      camera,
      person,
      helpOutline,
      logOutOutline,
      chevronForwardOutline,
      listOutline,
      settings
    });
  }

  abrirOpcao(opcao: string) {
    console.log('Abrindo configuração:', opcao);
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
      const t = await this.toast.create({
        message: 'Não foi possível sair. Tente novamente',
        duration: 2500,
        position: 'top',
        color: 'danger'
      });
      await t.present();
    } finally {
      this.saindo = false;
    }
  }

  navegarTab(rota: string) {
    this.router.navigate([rota]);
  }

}