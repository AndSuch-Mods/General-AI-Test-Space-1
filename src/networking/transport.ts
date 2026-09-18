export interface Transport {
  readonly ready: boolean;
  send(message: unknown): void;
  onMessage: (message: unknown) => void;
  onState: (state: 'open' | 'closed' | 'failed') => void;
  close(): void;
}
