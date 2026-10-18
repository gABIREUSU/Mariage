// evento.model.ts
export type StatusEvento = 'agendado' | 'concluido' | 'cancelado';

export interface Evento {
  idEvento: string;
  idCliente: string;
  idUsuario: string;
  data: string;
  horario: string;
  endereco: string;
  observacao: string;
  status: StatusEvento;
}