import { Injectable } from '@angular/core';

// usa o mesmo host da página, então funciona também de outro dispositivo na rede
const API = `http://${location.hostname}:3000/api`;

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  async getAll<T>(key: string): Promise<T[]> {
    const res = await fetch(`${API}/${key}`);
    if (!res.ok) throw new Error(`Falha ao ler ${key} (${res.status})`);
    return res.json();
  }

  async saveAll<T>(key: string, items: T[]): Promise<void> {
    const res = await fetch(`${API}/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    });
    if (!res.ok) throw new Error(`Falha ao gravar ${key} (${res.status})`);
  }
}