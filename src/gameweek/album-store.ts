import type { AlbumState } from "./album.ts";

export interface AlbumStore {
  getState(managerId: string): Promise<AlbumState | undefined>;
  saveState(state: AlbumState): Promise<void>;
}

const ALBUM_STORAGE_KEY = "sealed-xi:album";

interface PersistedAlbumData {
  albums: Record<string, AlbumState>;
}

export class LocalStorageAlbumStore implements AlbumStore {
  constructor(private storage: Storage = localStorage) {}

  private load(): PersistedAlbumData {
    const raw = this.storage.getItem(ALBUM_STORAGE_KEY);
    if (!raw) return { albums: {} };
    return JSON.parse(raw) as PersistedAlbumData;
  }

  private save(data: PersistedAlbumData): void {
    this.storage.setItem(ALBUM_STORAGE_KEY, JSON.stringify(data));
  }

  async getState(managerId: string): Promise<AlbumState | undefined> {
    return this.load().albums[managerId];
  }

  async saveState(state: AlbumState): Promise<void> {
    const data = this.load();
    data.albums[state.managerId] = state;
    this.save(data);
  }
}

export class InMemoryAlbumStore implements AlbumStore {
  private albums = new Map<string, AlbumState>();

  async getState(managerId: string): Promise<AlbumState | undefined> {
    return this.albums.get(managerId);
  }

  async saveState(state: AlbumState): Promise<void> {
    this.albums.set(state.managerId, state);
  }

  clear(): void {
    this.albums.clear();
  }
}
