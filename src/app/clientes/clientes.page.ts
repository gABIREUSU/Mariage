import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  ToastController,
  ViewWillEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, people, chevronForwardOutline } from 'ionicons/icons';
import { ClienteService } from '../services/cliente.service';
import { primeiroNome } from '../utils/contato';

interface ClienteCasal {
  idCliente: string;
  nomes: string;
  email: string;
  telefone: string;
}

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonList,
    IonItem,
    IonLabel,
    IonIcon
  ]
})
export class ClientesPage implements ViewWillEnter {

  clientes: ClienteCasal[] = [];
  carregado: boolean = false;

  constructor(
    private router: Router,
    private clienteService: ClienteService,
    private toast: ToastController
  ) {
    addIcons({ add, people, chevronForwardOutline });
  }

  // recarrega toda vez que a tela aparece (ao voltar do cadastro ou da edição)
  async ionViewWillEnter() {
    try {
      const todos = await this.clienteService.getAll();
      this.clientes = todos
        .map(c => ({
          idCliente: c.idCliente,
          nomes: `${primeiroNome(c.nomeNoiva)} & ${primeiroNome(c.nomeNoivo)}`,
          email: c.email,
          telefone: c.telefone
        }))
        .sort((a, b) => a.nomes.localeCompare(b.nomes, 'pt-BR'));
    } catch {
      await this.avisar('Não foi possível carregar os clientes. O servidor está rodando?');
    } finally {
      this.carregado = true;
    }
  }

  irParaNovoCliente() {
    this.router.navigateByUrl('/tabs/clientes/novo');
  }

  selecionarCliente(cliente: ClienteCasal) {
    this.router.navigateByUrl('/tabs/clientes/editar/' + cliente.idCliente);
  }

  private async avisar(mensagem: string) {
    const t = await this.toast.create({
      message: mensagem,
      duration: 2500,
      position: 'top',
      color: 'danger'
    });
    await t.present();
  }

    porId(_: number, c: ClienteCasal) {
    return c.idCliente;
  }
}