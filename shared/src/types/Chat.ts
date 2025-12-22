export interface ChatMessage {
    sender: string;
    text: string;
    isSystem?: boolean;
}

export const CHAT_MESSAGE = 'CHAT_MESSAGE';
