import { Injectable, Injector, inject, runInInjectionContext } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  onAuthStateChanged
} from '@angular/fire/auth';
import {
  User,
  browserPopupRedirectResolver,
  linkWithPopup,
  linkWithRedirect,
  reauthenticateWithPopup,
  reauthenticateWithRedirect
} from 'firebase/auth';
import { AuthService } from './auth.service';

const ESCOPO_CALENDAR = 'https://www.googleapis.com/auth/calendar.events';
const URL_EVENTOS = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

const VALIDADE_MS = 55 * 60 * 1000;
const CHAVE_TOKEN = 'mariage-google-token';
const CHAVE_REDIRECT = 'mariage-google-redirect';

interface TokenSalvo {
  token: string;
  expiraEm: number;
  uid: string;
}

export interface EventoGoogle {
  titulo: string;
  data: string;
  horario: string;
  endereco: string;
  observacao: string;
}

@Injectable({ providedIn: 'root' })
export class GoogleAgendaService {
  private auth = inject(Auth);
  private injector = inject(Injector);
  private authService = inject(AuthService);

  private token: string | null = null;
  private expiraEm = 0;
  private uidDoToken: string | null = null;
  private pendente: Promise<string> | null = null;

  constructor() {
    this.restaurarToken();
    onAuthStateChanged(this.auth, user => {
      if (!user || user.uid !== this.uidDoToken) this.limparToken();
    });
  }

  temToken(): boolean {
    return !!this.token && Date.now() < this.expiraEm;
  }

  temGoogleVinculado(): boolean {
    const user = this.auth.currentUser;
    return !!user && user.providerData.some(p => p.providerId === 'google.com');
  }

  limparToken(): void {
    this.token = null;
    this.expiraEm = 0;
    this.uidDoToken = null;
    try {
      sessionStorage.removeItem(CHAVE_TOKEN);
    } catch {
      return;
    }
  }

  usaRedirect(): boolean {
    return this.authService.modoInstalado();
  }

  dicaConectar(): string {
    return this.usaRedirect() && !this.temToken()
      ? '. Conecte o Google Agenda em Configurações'
      : '';
  }

  conectarPorRedirect(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return Promise.reject(new Error('sem-usuario'));
    const { provider, temGoogle } = this.provedor(user);
    try {
      sessionStorage.setItem(CHAVE_REDIRECT, user.uid);
    } catch {
      return Promise.reject(new Error('sem-armazenamento'));
    }
    return this.dentro(() =>
      temGoogle
        ? reauthenticateWithRedirect(user, provider, browserPopupRedirectResolver)
        : linkWithRedirect(user, provider, browserPopupRedirectResolver)
    );
  }

  async concluirRedirect(): Promise<boolean> {
    let pendente: string | null = null;
    try {
      pendente = sessionStorage.getItem(CHAVE_REDIRECT);
      sessionStorage.removeItem(CHAVE_REDIRECT);
    } catch {
      return false;
    }
    if (!pendente) return false;
    const resultado = await this.authService.resultadoRedirect();
    if (!resultado) return false;
    const token = GoogleAuthProvider.credentialFromResult(resultado)?.accessToken;
    if (!token) throw new Error('sem-token');
    this.guardarToken(token, resultado.user.uid);
    return true;
  }

  obterToken(): Promise<string> {
    if (this.temToken()) return Promise.resolve(this.token as string);
    if (this.pendente) return this.pendente;

    const user = this.auth.currentUser;
    if (!user) return Promise.reject(new Error('sem-usuario'));
    if (this.usaRedirect()) return Promise.reject(new Error('conectar-em-configuracoes'));

    const { provider, temGoogle } = this.provedor(user);

    const popup = this.dentro(() =>
      temGoogle
        ? reauthenticateWithPopup(user, provider, browserPopupRedirectResolver)
        : linkWithPopup(user, provider, browserPopupRedirectResolver)
    );

    this.pendente = popup
      .then(resultado => {
        const token = GoogleAuthProvider.credentialFromResult(resultado)?.accessToken;
        if (!token) throw new Error('sem-token');
        this.guardarToken(token, user.uid);
        return token;
      })
      .finally(() => {
        this.pendente = null;
      });

    return this.pendente;
  }

  async verificarAcesso(): Promise<void> {
    const token = await this.obterToken();
    const resp = await fetch(`${URL_EVENTOS}?maxResults=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) await this.falhar(resp);
  }

  async criarEvento(dados: EventoGoogle): Promise<string> {
    const token = await this.obterToken();
    const resp = await fetch(URL_EVENTOS, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: this.corpo(dados)
    });
    if (!resp.ok) await this.falhar(resp);
    const criado = (await resp.json()) as { id: string };
    return criado.id;
  }

  async atualizarEvento(googleEventId: string, dados: EventoGoogle): Promise<void> {
    const token = await this.obterToken();
    const resp = await fetch(`${URL_EVENTOS}/${encodeURIComponent(googleEventId)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: this.corpo(dados)
    });
    if (!resp.ok) await this.falhar(resp);
  }

  async apagarEvento(googleEventId: string): Promise<void> {
    const token = await this.obterToken();
    const resp = await fetch(`${URL_EVENTOS}/${encodeURIComponent(googleEventId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (resp.ok || resp.status === 404 || resp.status === 410) return;
    await this.falhar(resp);
  }

  cancelado(e: unknown): boolean {
    const code = (e as { code?: string })?.code ?? '';
    return code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request';
  }

  mensagemDeErro(e: unknown): string {
    const code = (e as { code?: string })?.code ?? '';
    const msg = e instanceof Error ? e.message : '';
    switch (code) {
      case 'auth/popup-blocked':
        return 'O navegador bloqueou o popup. Libere popups para este site e tente de novo';
      case 'auth/user-mismatch':
        return 'Escolha a mesma conta Google com a qual você entrou no app';
      case 'auth/credential-already-in-use':
        return 'Essa conta Google já está vinculada a outro usuário do app';
      case 'auth/network-request-failed':
        return 'Sem conexão com o Google. Verifique a internet';
      case 'auth/unauthorized-domain':
        return 'Este domínio não está autorizado no Firebase (Authentication > Settings)';
      case 'auth/operation-not-allowed':
        return 'Login com Google não está habilitado no Firebase';
    }
    switch (msg) {
      case 'conectar-em-configuracoes':
        return 'Conecte o Google Agenda em Configurações';
      case 'sem-armazenamento':
        return 'O navegador bloqueou o armazenamento do site. Libere e tente de novo';
      case 'sem-usuario':
        return 'Entre na sua conta antes de conectar o Google Agenda';
      case 'sem-token':
        return 'O Google não devolveu a permissão. Tente de novo';
      case 'token-invalido':
        return 'A autorização expirou. Tente conectar de novo';
      case 'sem-escopo':
        return 'Permissão do calendário não concedida. Na tela do Google, deixe marcada a opção de eventos do Agenda';
      case 'api-desativada':
        return 'A Google Calendar API não está ativada no projeto mariage-1de64';
      case 'acesso-negado':
        return 'O Google recusou o acesso à agenda';
      case 'falha-api':
        return 'O Google Agenda não aceitou o pedido. Tente novamente';
      case 'Failed to fetch':
        return 'Sem conexão com o Google. Verifique a internet';
    }
    return 'Não foi possível conectar ao Google Agenda. Tente novamente';
  }

  private async falhar(resp: Response): Promise<never> {
    if (resp.status === 401) {
      this.limparToken();
      throw new Error('token-invalido');
    }
    if (resp.status === 403) {
      const corpo = await resp.text().catch(() => '');
      if (corpo.includes('accessNotConfigured') || corpo.includes('SERVICE_DISABLED')) {
        throw new Error('api-desativada');
      }
      if (
        corpo.includes('insufficientPermissions') ||
        corpo.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')
      ) {
        this.limparToken();
        throw new Error('sem-escopo');
      }
      throw new Error('acesso-negado');
    }
    throw new Error('falha-api');
  }

  private provedor(user: User): { provider: GoogleAuthProvider; temGoogle: boolean } {
    const provider = new GoogleAuthProvider();
    provider.addScope(ESCOPO_CALENDAR);
    const infoGoogle = user.providerData.find(p => p.providerId === 'google.com');
    if (infoGoogle?.email) {
      provider.setCustomParameters({ login_hint: infoGoogle.email });
    }
    return { provider, temGoogle: !!infoGoogle };
  }

  private guardarToken(token: string, uid: string): void {
    this.token = token;
    this.expiraEm = Date.now() + VALIDADE_MS;
    this.uidDoToken = uid;
    const salvo: TokenSalvo = { token, expiraEm: this.expiraEm, uid };
    try {
      sessionStorage.setItem(CHAVE_TOKEN, JSON.stringify(salvo));
    } catch {
      return;
    }
  }

  private restaurarToken(): void {
    try {
      const salvo = JSON.parse(sessionStorage.getItem(CHAVE_TOKEN) ?? 'null') as TokenSalvo | null;
      if (salvo?.token && salvo.expiraEm > Date.now()) {
        this.token = salvo.token;
        this.expiraEm = salvo.expiraEm;
        this.uidDoToken = salvo.uid;
      }
    } catch {
      return;
    }
  }

  private corpo(dados: EventoGoogle): string {
    const descricao = [`Horário: ${dados.horario}`, dados.observacao.trim()]
      .filter(Boolean)
      .join('\n\n');
    return JSON.stringify({
      summary: dados.titulo,
      location: dados.endereco,
      description: descricao,
      start: { date: dados.data },
      end: { date: this.diaSeguinte(dados.data) }
    });
  }

  private diaSeguinte(data: string): string {
    const [ano, mes, dia] = data.split('-').map(Number);
    const prox = new Date(ano, mes - 1, dia + 1);
    const mm = String(prox.getMonth() + 1).padStart(2, '0');
    const dd = String(prox.getDate()).padStart(2, '0');
    return `${prox.getFullYear()}-${mm}-${dd}`;
  }

  private dentro<T>(fn: () => T): T {
    return runInInjectionContext(this.injector, fn);
  }
}
