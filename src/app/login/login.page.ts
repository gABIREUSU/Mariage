import { Component, OnInit } from '@angular/core';
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
  IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mail, lockClosed, eye, eyeOff } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
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
export class LoginPage implements OnInit {

  email: string = '';
  senha: string = '';
  mostrarSenha: boolean = false;

  constructor(private router: Router) {
    addIcons({ mail, lockClosed, eye, eyeOff });
  }

  ngOnInit() {}

  alternarVisibilidadeSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  fazerLogin() {
    this.router.navigate(['/configuracoes']);
  }

  esqueceuSenha() {
    console.log('Esqueceu a senha clicado');
  }

  irParaCadastro() {
    console.log('Cadastre-se clicado');
  }

}