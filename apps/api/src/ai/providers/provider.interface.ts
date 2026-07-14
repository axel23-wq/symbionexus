export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

export interface AIProvider {
  chat(prompt: string, options?: ChatOptions): Promise<string>;

  streamChat(
    prompt: string,
    onToken: (token: string) => void,
    options?: ChatOptions
  ): Promise<void>;

  embed(text: string): Promise<number[]>;

  getModel(): string;
}
