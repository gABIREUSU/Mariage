import { Injectable, inject } from '@angular/core';
import {
  ActionSheetController,
  AlertController,
  NavController,
  ToastController
} from '@ionic/angular/standalone';
import { Evento } from '../models/evento.model';
import { statusExibido } from '../utils/evento';
import { EventoService } from './evento.service';
import { GoogleAgendaService } from './google-agenda.service';
import { SessaoService } from './sessao.service';

type Acao = 'cancelar' | 'excluir';
type Escolha = Acao | 'editar';

@Injectable({ providedIn: 'root' })
export class AcoesEventoService {
  private actionSheet = inject(ActionSheetController);
  private alert = inject(AlertController);
  private nav = inject(NavController);
  private toast = inject(ToastController);
  private eventos = inject(EventoService);
  private google = inject(GoogleAgendaService);
  private sessao = inject(SessaoService);

  async abrir(evento: Evento, titulo: string): Promise<boolean> {
    const escolha = await this.escolherAcao(evento, titulo);
    if (!escolha) return false;
    if (escolha === 'editar') {
      await this.nav.navigateForward(`/tabs/eventos/editar/${evento.idEvento}`);
      return false;
    }
    const acao: Acao = escolha;

    const googleId = evento.googleEventId;
    const meu = evento.idUsuario === this.sessao.idUsuario;
    const usaGoogle = !!googleId && meu && this.google.temGoogleVinculado();

    const { confirmado, token } = await this.confirmar(acao, titulo, usaGoogle);
    if (!confirmado) return false;

    try {
      if (acao === 'cancelar') {
        await this.eventos.update(evento.idEvento, { status: 'cancelado' });
      } else {
        await this.eventos.delete(evento.idEvento);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      await this.avisar(msg || 'Não foi possível concluir. Tente novamente', 'danger');
      return false;
    }

    let removidoDoGoogle = true;
    if (googleId) {
      removidoDoGoogle =
        usaGoogle && token ? await this.removerNoGoogle(token, evento, googleId, acao) : false;
    }

    const feito = acao === 'cancelar' ? 'Evento cancelado' : 'Evento excluído';
    if (removidoDoGoogle) {
      await this.avisar(feito, 'success');
    } else {
      await this.avisar(
        `${feito}, mas não foi removido do Google Agenda${this.google.dicaConectar()}`,
        'warning'
      );
    }
    return true;
  }

  private async escolherAcao(evento: Evento, titulo: string): Promise<Escolha | null> {
    const botoes = [];
    if (statusExibido(evento) === 'agendado') {
      botoes.push({ text: 'Editar evento', data: 'editar' });
      botoes.push({ text: 'Cancelar evento', data: 'cancelar' });
    }
    botoes.push({ text: 'Excluir evento', role: 'destructive', data: 'excluir' });
    botoes.push({ text: 'Voltar', role: 'cancel' });

    const sheet = await this.actionSheet.create({
      header: titulo,
      subHeader: `${evento.data.split('-').reverse().join('/')} às ${evento.horario}`,
      buttons: botoes
    });
    await sheet.present();
    const { data } = await sheet.onDidDismiss();
    return data === 'editar' || data === 'cancelar' || data === 'excluir' ? data : null;
  }

  private async confirmar(
    acao: Acao,
    titulo: string,
    usaGoogle: boolean
  ): Promise<{ confirmado: boolean; token: Promise<boolean> | null }> {
    const estado = { token: null as Promise<boolean> | null };
    const cancelando = acao === 'cancelar';
    const complemento = usaGoogle ? ' Ele também será removido do seu Google Agenda.' : '';

    const alerta = await this.alert.create({
      header: cancelando ? 'Cancelar evento?' : 'Excluir evento?',
      message: cancelando
        ? `O ${titulo} será cancelado e a data ficará livre.${complemento}`
        : `O ${titulo} será excluído e isso não pode ser desfeito.${complemento}`,
      buttons: [
        { text: 'Voltar', role: 'cancel' },
        {
          text: cancelando ? 'Cancelar evento' : 'Excluir',
          role: 'confirm',
          handler: () => {
            if (usaGoogle) {
              estado.token = this.google.obterToken().then(
                () => true,
                (e: unknown) => {
                  if (!this.google.cancelado(e)) console.error('Google Agenda:', e);
                  return false;
                }
              );
            }
          }
        }
      ]
    });
    await alerta.present();
    const { role } = await alerta.onDidDismiss();
    return { confirmado: role === 'confirm', token: estado.token };
  }

  private async removerNoGoogle(
    token: Promise<boolean>,
    evento: Evento,
    googleId: string,
    acao: Acao
  ): Promise<boolean> {
    if (!(await token)) return false;
    try {
      await this.google.apagarEvento(googleId);
    } catch (e) {
      console.error('Google Agenda:', e);
      return false;
    }

    if (acao === 'cancelar') {
      try {
        await this.eventos.definirGoogleEventId(evento.idEvento, null);
      } catch (e) {
        console.error('Não foi possível limpar o googleEventId:', e);
      }
    }
    return true;
  }

  private async avisar(mensagem: string, cor: 'success' | 'danger' | 'warning') {
    const t = await this.toast.create({
      message: mensagem,
      duration: cor === 'warning' ? 4500 : 2500,
      position: 'top',
      color: cor
    });
    await t.present();
  }
}
