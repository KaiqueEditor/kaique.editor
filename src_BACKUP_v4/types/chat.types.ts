export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ChatConfig {
  model: string;
  systemInstruction: string;
}
