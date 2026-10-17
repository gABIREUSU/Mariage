import { Component, OnInit } from '@angular/core';
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
  IonToolbar
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
export class ConfiguracoesPage implements OnInit {

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

  ngOnInit() {}

  abrirOpcao(opcao: string) {
    console.log('Abrindo configuração:', opcao);
  }

  sairDaConta() {
    this.router.navigate(['/login']);
  }

  navegarTab(rota: string) {
    this.router.navigate([rota]);
  }

}