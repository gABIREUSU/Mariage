export function traduzirErroFirestore(e: unknown): Error {
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'permission-denied':
      return new Error('Sem permissão para esta operação. Entre novamente no app');
    case 'unavailable':
    case 'deadline-exceeded':
      return new Error('Sem conexão com o banco. Verifique a internet');
    case 'not-found':
      return new Error('Registro não encontrado');
    default:
      return e instanceof Error ? e : new Error('Falha ao acessar o banco');
  }
}
