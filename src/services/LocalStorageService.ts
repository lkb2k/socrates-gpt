// src/services/LocalStorageService.js

export class LocalStorageService {
  getApiKey(): string {
    return localStorage.getItem("apiKey") || "";
  }

  setApiKey(value: string) {
    localStorage.setItem("apiKey", value);
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  setItem(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  removeItem(key: string) {
    localStorage.removeItem(key);
  }

  clear() {
    localStorage.clear();
  }
}
