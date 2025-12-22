export interface ChatMessage {
    sender: string;
    text: string;
    isSystem?: boolean;
}
export declare const CHAT_MESSAGE = "CHAT_MESSAGE";
