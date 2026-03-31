export function resolveWebSocketUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  const normalizedApiUrl = apiUrl.replace(/\/+$/, '');
  const protocol = normalizedApiUrl.startsWith('https://') ? 'wss://' : 'ws://';
  const withoutProtocol = normalizedApiUrl.replace(/^https?:\/\//, '');
  return `${protocol}${withoutProtocol}/ws`;
}
