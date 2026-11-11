import { Evento } from '../models/evento.model';
import { Cliente } from '../models/cliente.model';
export interface EventoView {
  evento: Evento;
  titulo: string;
  nomes: string;
}
const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0];
export function montarViews(eventos: Evento[], clientes: Cliente[]): EventoView[] {
  const porId = new Map<string, Cliente>(
    clientes.map((c): [string, Cliente] => [c.idCliente, c]),
  );
  return eventos.map(evento => {
    const c = porId.get(evento.idCliente);
    return {
      evento,
      titulo: c
        ? `Casamento de ${primeiroNome(c.nomeNoiva)} & ${primeiroNome(c.nomeNoivo)}`
        : 'Casamento',
      nomes: c ? `${c.nomeNoiva} ${c.nomeNoivo}` : '',
    };
  });
}
