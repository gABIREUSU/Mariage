import { Evento, StatusEvento } from '../models/evento.model';
import { Cliente } from '../models/cliente.model';
import { Usuario } from '../models/usuario.model';
import { hojeISO } from './datas';

export interface EventoView {
  evento: Evento;
  titulo: string;
  nomes: string;
  responsavel: string;
  status: StatusEvento;
}

const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];

export function statusExibido(evento: Evento, hoje: string = hojeISO()): StatusEvento {
  return evento.status === 'agendado' && evento.data < hoje ? 'concluido' : evento.status;
}

export function montarViews(
  eventos: Evento[],
  clientes: Cliente[],
  usuarios: Usuario[] = [],
): EventoView[] {
  const porId = new Map<string, Cliente>(
    clientes.map((c): [string, Cliente] => [c.idCliente, c]),
  );
  const nomeUsuario = new Map<string, string>(
    usuarios.map((u): [string, string] => [u.idUsuario, u.nome]),
  );
  const hoje = hojeISO();
  return eventos.map(evento => {
    const c = porId.get(evento.idCliente);
    return {
      evento,
      titulo: c
        ? `Casamento de ${primeiroNome(c.nomeNoiva)} & ${primeiroNome(c.nomeNoivo)}`
        : 'Casamento',
      nomes: c ? `${c.nomeNoiva} ${c.nomeNoivo}` : '',
      responsavel: nomeUsuario.get(evento.idUsuario) ?? '',
      status: statusExibido(evento, hoje),
    };
  });
}
