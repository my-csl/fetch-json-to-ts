export interface TypeContext {
  code: string;
  indentLevel: number;
  push(code: string): void;
  newline(): void;
  indent(): void;
  deindent(): void;
}

export type API = string | { name: string; api: string };

export interface Config {
  baseURL?: string;
  token?: string | (<T extends { token: string }>() => Promise<T>);
  headers?: Record<string, any>;
  typePath?: string;
  apis: Array<API>;
}
