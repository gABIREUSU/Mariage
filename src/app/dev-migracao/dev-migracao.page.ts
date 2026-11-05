import { Component } from '@angular/core';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { MigradorService, ResultadoMigracao } from '../services/migrador.service';

// TEMPORÁRIO: página de apoio à migração (sai na fase 3)
@Component({
  selector: 'app-dev-migracao',
  standalone: true,
  imports: [IonContent, IonButton],
  template: `
    <ion-content class="ion-padding">
      <h2>Migração para o Firestore</h2>
      <p>Copia os dados do servidor Node para o Firestore, mantendo os ids. Pode rodar mais de uma vez.</p>

      <ion-button (click)="clientes()" [disabled]="rodando">Migrar clientes</ion-button>
      <ion-button (click)="eventos()" [disabled]="rodando">Migrar eventos</ion-button>

      @for (linha of log; track $index) {
        <p>{{ linha }}</p>
      }
    </ion-content>
  `
})
export class DevMigracaoPage {
  log: string[] = [];
  rodando = false;

  constructor(private migrador: MigradorService) {}

  clientes() {
    return this.executar('clientes', () => this.migrador.migrarClientes());
  }

  eventos() {
    return this.executar('eventos', () => this.migrador.migrarEventos());
  }

  private async executar(nome: string, tarefa: () => Promise<ResultadoMigracao>) {
    this.rodando = true;
    this.log = [`Migrando ${nome}...`];
    try {
      const r = await tarefa();
      this.log.push(`${r.gravados} de ${r.total} ${nome} gravados no Firestore.`);
      for (const f of r.falhas) {
        this.log.push(`FALHA em ${f.id}: ${f.motivo}`);
      }
    } catch (e) {
      this.log.push('Erro: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      this.rodando = false;
    }
  }
}