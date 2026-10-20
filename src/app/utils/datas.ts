const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export function rotuloMes(chave: string): string { // 'YYYY-MM'
  const [ano, mes] = chave.split('-');
  return `${MESES[+mes - 1]} ${ano}`;
}

export function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// data local (toISOString usaria UTC e viraria o dia à noite no Brasil)
export function hojeISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// '2026-06-14' -> '14/06'
export function dataCurta(iso: string): string {
  const [, mes, dia] = iso.split('-');
  return `${dia}/${mes}`;
}