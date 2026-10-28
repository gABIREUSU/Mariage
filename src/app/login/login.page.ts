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
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { mail, lockClosed, eye, eyeOff, personOutline } from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { SessaoService } from '../services/sessao.service';
import { emailValido } from '../utils/contato';

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
export class LoginPage {

  nome: string = '';
  email: string = '';
  senha: string = '';
  mostrarSenha: boolean = false;
  modoCadastro: boolean = false;
  enviando: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private sessao: SessaoService,
    private toast: ToastController
  ) {
    addIcons({ mail, lockClosed, eye, eyeOff, personOutline });
  }

  alternarVisibilidadeSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

  alternarModo() {
    this.modoCadastro = !this.modoCadastro;
    this.senha = '';
  }

  async enviar() {
    if (this.enviando) return;

    const email = this.email.trim();
    if (this.modoCadastro && !this.nome.trim()) {
      await this.avisar('Informe o seu nome');
      return;
    }
    if (!emailValido(email)) {
      await this.avisar('Informe um e-mail válido');
      return;
    }
    if (!this.senha) {
      await this.avisar('Informe a senha');
      return;
    }
    if (this.modoCadastro && this.senha.length < 6) {
      await this.avisar('A senha precisa ter pelo menos 6 caracteres');
      return;
    }

    this.enviando = true;
    try {
      if (this.modoCadastro) {
        await this.authService.cadastrar(this.nome, email, this.senha);
        this.sessao.sincronizar();
      } else {
        await this.authService.entrar(email, this.senha);
      }
      this.nome = '';
      this.senha = '';
      this.modoCadastro = false;
      // tira o foco do botão antes de a tela de login ser escondida
      (document.activeElement as HTMLElement | null)?.blur();
      await this.router.navigateByUrl('/tabs/eventos', { replaceUrl: true });
    } catch (e) {
      await this.avisar(this.authService.mensagemDeErro(e));
    } finally {
      this.enviando = false;
    }
  }

  async esqueceuSenha() {
    const email = this.email.trim();
    if (!emailValido(email)) {
      await this.avisar('Digite o seu e-mail no campo acima para receber o link');
      return;
    }
    try {
      await this.authService.recuperarSenha(email);
      await this.avisar(
        'Se o e-mail estiver cadastrado, enviamos um link para redefinir a senha',
        'success'
      );
    } catch (e) {
      await this.avisar(this.authService.mensagemDeErro(e));
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