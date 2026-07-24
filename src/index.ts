// Demo Result<T> type for illustrating error handling patterns.
export type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

// Demo utility class — replace with actual package implementation.
export class Example {
  private message: string;

  constructor(message: string = 'Hello from the package') {
    this.message = message;
  }

  getMessage(): string {
    return this.message;
  }

  setMessage(message: string): void {
    this.message = message;
  }
}
