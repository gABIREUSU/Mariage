import { Component, OnInit, inject } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';
import { UsuarioService } from '../services/usuario.service';
import { ClienteService } from '../services/cliente.service';
import { EventoService } from '../services/evento.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
})
export class HomePage implements OnInit {
  private usuarios = inject(UsuarioService);
  private clientes = inject(ClienteService);
  private eventos = inject(EventoService);

  async ngOnInit() {
    console.log('Já no Storage:', {
      usuarios: (await this.usuarios.getAll()).length,
      clientes: (await this.clientes.getAll()).length,
      eventos: (await this.eventos.getAll()).length,
    });

    // email único por execução, já que o Storage persiste entre recargas
    const email = `teste${Date.now()}@mail.com`;

    const u1 = await this.usuarios.create({ nome: 'Fotógrafo 1', email, senha: '123' });
    const c = await this.clientes.create({
      nomeNoiva: 'Ana', nomeNoivo: 'Carlos', email: 'casal@mail.com', telefone: '31987654321',
    });
    await this.eventos.create({
      idCliente: c.idCliente, idUsuario: u1.idUsuario, data: '2026-12-15', horario: '14:00',
      endereco: 'Rua A, 123', observacao: '', status: 'agendado',
    });
    console.log('1) eventos do cliente (esperado 1):', (await this.eventos.getByCliente(c.idCliente)).length);

    try { await this.usuarios.create({ nome: 'Dup', email, senha: 'x' }); console.log('2) FALHOU: aceitou email duplicado'); }
    catch (e) { console.log('2) OK, bloqueou email duplicado:', (e as Error).message); }

    try { await this.usuarios.delete(u1.idUsuario); console.log('3) FALHOU: excluiu usuário com eventos'); }
    catch (e) { console.log('3) OK, restrict funcionou:', (e as Error).message); }

    const u2 = await this.usuarios.create({ nome: 'Fotógrafo 2', email: `b${email}`, senha: '123' });
    await this.eventos.reatribuirResponsavel(u1.idUsuario, u2.idUsuario);
    await this.usuarios.delete(u1.idUsuario);
    console.log('4) OK, reatribuiu e excluiu o usuário 1. Eventos do usuário 2 (esperado 1):',
      (await this.eventos.getByUsuario(u2.idUsuario)).length);

    await this.clientes.delete(c.idCliente);
    console.log('5) eventos do cliente após excluí-lo (esperado 0):', (await this.eventos.getByCliente(c.idCliente)).length);

    console.log('6) login correto:', !!(await this.usuarios.login(u2.email, '123')),
      '| login errado (esperado false):', !!(await this.usuarios.login(u2.email, 'errada')));
  }
}