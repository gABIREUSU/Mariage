import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  ToastController,
  ViewWillEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline, mailOutline, logoWhatsapp } from 'ionicons/icons';
import { ClienteService } from '../services/cliente.service';
import { emailValido, formatarTelefone, telefoneValido } from '../utils/contato';

@Component({
  selector: 'app-novo-cliente',
  templateUrl: './novo-cliente.page.html',
  styleUrls: ['./novo-cliente.page.scss'],
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
export class NovoClientePage implements ViewWillEnter {

  nomeNoiva: string = '';
  nomeNoivo: string = '';
  emailPrincipal: string = '';
  telefoneWhatsapp: string = '';
  salvando: boolean = false;

  constructor(
    private router: Router,
    private clienteService: ClienteService,
    private toast: ToastController
  ) {
    addIcons({ personOutline, mailOutline, logoWhatsapp });
  }

  ionViewWillEnter() {
    this.nomeNoiva = '';
    this.nomeNoivo = '';
    this.emailPrincipal = '';
    this.telefoneWhatsapp = '';
  }

  aoDigitarTelefone(ev: Event) {
    const campo = ev.target as HTMLInputElement;
    const formatado = formatarTelefone(String(campo.value ?? ''));
    this.telefoneWhatsapp = formatado;
    campo.value = formatado;
  }

  async cadastrarCliente() {
    if (this.salvando) return;

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
      await this.clienteService.create({
        nomeNoiva,
        nomeNoivo,
        email,
        telefone: this.telefoneWhatsapp
      });
      await this.avisar('Cliente cadastrado', 'success');
      await this.router.navigateByUrl('/tabs/clientes');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      await this.avisar(
        !msg || msg === 'Failed to fetch'
          ? 'Não foi possível salvar. O servidor está rodando?'
          : msg
      );
    } finally {
      this.salvando = false;
    }
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