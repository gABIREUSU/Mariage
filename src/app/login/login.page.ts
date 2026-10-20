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
  IonButton,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mail, lockClosed, eye, eyeOff } from 'ionicons/icons';
import { UsuarioService } from '../services/usuario.service';
import { SessaoService } from '../services/sessao.service';

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
export class LoginPage{

  email: string = '';
  senha: string = '';
  mostrarSenha: boolean = false;
  entrando: boolean = false;

  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private sessao: SessaoService,
    private toast: ToastController
  ) {
    addIcons({ mail, lockClosed, eye, eyeOff });
  }

  alternarVisibilidadeSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  async fazerLogin() {
    if (this.entrando) return;

    const email = this.email.trim();
    if (!email || !this.senha) {
      await this.avisar('Informe e-mail e senha');
      return;
    }

    this.entrando = true;
    try {
      const usuario = await this.usuarioService.login(email, this.senha);
      if (!usuario) {
        await this.avisar('E-mail ou senha inválidos');
        return;
      }
      this.sessao.entrar(usuario);
      this.senha = '';
      await this.router.navigateByUrl('/tabs/eventos');
    } catch {
      await this.avisar('Não foi possível entrar. O servidor está rodando?');
    } finally {
      this.entrando = false;
    }
  }

  esqueceuSenha() {
    console.log('Esqueceu a senha clicado');
  }

  irParaCadastro() {
    console.log('Cadastre-se clicado');
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

}