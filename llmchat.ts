/**
 * LLM Chatboy Concept - AI Augmented Version
 */

import { GeminiLLM } from './gemini-llm';
import { validateLLMResponse, validateSummaryLength } from './validator';

export interface Message {
    role: "user" | "llm";
    content: string;
    timestamp: number;
}

export interface Chat {
    name: string;
    messages: Array<Message>;
    summary: string;
    historyString: string;
}

export interface LLMReply {reply: string}

export class LLMChat {
    private chats: Array<Chat> = [];

    /**
     * Initializes a chat conversation.
     * 
     * @param name name of chat conversation
     * @returns new chat conversation
     */
    makeChat(name: string): Chat {
        const newChat: Chat = {
            name: name, 
            messages: [], 
            summary: "",
            historyString: ""
        };
        this.chats.push(newChat);
        return newChat;
    }

    /**
     * Deletes provided chat.
     * 
     * @param chat chat to be deleted
     */
    deleteChat(chat: Chat): void {
        this.chats = this.chats.filter(c => c !== chat);
    }

    /**
     * Renames the chat conversation.
     * 
     * @param chat chat to rename
     * @param newName new name for the chat
     */
    renameChat(chat: Chat, newName: string): void {
        chat.name = newName;
    }

    /**
     * Attempts to send and receive a response in a chat conversation.
     * 
     * @param chat conversation to continue
     * @param content prompt for conversation
     * @param llm interface for Gemini API
     * @returns promise of response for llm conversation
     * 
     * @throws Error if unable to call Gemini API
     */
    async sendMessage(chat: Chat, content: string, llm: GeminiLLM): Promise<LLMReply> {
        // Save User message
        const userMsg: Message = { role: "user", content, timestamp: Date.now() };
        chat.messages.push(userMsg);
        this.appendToHistory(chat, userMsg);

        const prompt = this.createConversationPrompt(chat.historyString, content);

        // Call LLM with validators, timeout, retries
        const response = await this.callLLMWithValidation(
            llm,
            prompt,
            [],
            chat
        );

        // Save LLM response
        const llmMsg: Message = { role: "llm", content: response.reply, timestamp: Date.now() };
        chat.messages.push(llmMsg);
        this.appendToHistory(chat, llmMsg);
        
        return response;
    }
    
    /**
     * Attempts to update the summary of an ongoing conversation.
     * 
     * @param chat chat to summarize, requires a started conversation
     * @param llm interface for Gemini API
     * @returns promise of summary of ongoing chat conversation
     * 
     * @throws Error if unable to call Gemini API or if conversation not started
     */
    async updateSummary(chat: Chat, llm: GeminiLLM): Promise<LLMReply> {
        if (chat.messages.length === 0) {
            throw new Error("❌ Cannot summarize an empty chat.");
        }
        
        const prompt = this.createSummaryPrompt(chat.historyString);

        const response = await this.callLLMWithValidation(
            llm,
            prompt,
            [validateSummaryLength], // enforce summary length
            chat
        );
        
        chat.summary = response.reply;
        return response;
    }

    /**
     * Obtains all chats.
     * 
     * @returns chats
     */
    getChats(): Chat[] {
        return this.chats.map(chat => ({
            name: chat.name,
            summary: chat.summary,
            historyString: chat.historyString,
            messages: chat.messages.map(msg => ({ ...msg }))
        }));
    }

    /**
     * Utility function for formatting dates.
     * 
     * @param ts timestamp
     * @returns string representation of the timestamp as a date
     */
    formatTimestamp(ts: number): string {
        return new Date(ts).toLocaleString();
    }

    /**
     * Utility function for viewing the chat.
     * 
     * @param chat prints the chat conversation in a legible format
     */
    printChat(chat: Chat): void {
        console.log(`📌 Chat: ${chat.name}`);
        chat.messages.forEach(m => {
            console.log(`[${this.formatTimestamp(m.timestamp)}] ${m.role.toUpperCase()}: ${m.content}`);
        });
        if (chat.summary) {
            console.log(`--- Summary ---\n${chat.summary}`);
        }
    }

    /**
     * Helper function for wrapping calls to LLMs with a timeout such that the LLM isn't stuck waiting perpetually.
     * 
     * @param llm Gemini API interface
     * @param prompt prompt to ask
     * @param timeoutMs time to wait before timeout
     * @returns promise of response to prompt from LLM
     */
    private executeWithTimeout(llm: GeminiLLM, prompt: string, timeoutMs: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('LLM call timed out')), timeoutMs);
            llm.executeLLM(prompt)
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(err => {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }

    /**
     * Helper function for wrapping calls to LLMs with validation and timeout.
     * 
     * @param llm Gemini API interface
     * @param prompt prompt to ask
     * @param validators additional validation functions for LLM response
     * @param chat conversation that is being continued
     * @param maxRetries number of attempts to ask prompt
     * @param timeoutMs time to wait before timeout
     * @returns promise of response to prompt from LLM
     * 
     * @throws Error if unable to connect with LLM after maxRetries
     */
    private async callLLMWithValidation(
        llm: GeminiLLM,
        prompt: string,
        validators: Array<(s: string, chat: Chat) => void>,
        chat: Chat,
        maxRetries = 3,
        timeoutMs = 10000
    ): Promise<LLMReply> {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const raw = await this.executeWithTimeout(llm, prompt, timeoutMs);

                const response = validateLLMResponse(raw);
                
                // Apply all validators
                validators.forEach(v => v(response.reply, chat));

                return response; // Success
            } catch (error) {
                console.warn(`⚠️ Attempt ${attempt} failed: ${(error as Error).message}`);
                if (attempt === maxRetries) throw error;
                await new Promise(res => setTimeout(res, 500 * attempt)); // exponential backoff
            }
        }
        throw new Error(`❌ Unexpected LLM failure after ${maxRetries} retries`);
    }

    /**
     * Helper function for appending a message to the incremental history.
     * 
     * @param chat chat history to update
     * @param message message to append
     */
    private appendToHistory(chat: Chat, message: Message) {
        chat.historyString += `[${message.role.toUpperCase()}] ${message.content}\n`;
    }

    /**
     * Create the prompt for Gemini with hardwired preferences to summarize information.
     * 
     * @param chatHistory conversation history so far, must be nonempty
     */
    private createSummaryPrompt(chatHistory: string): string {
        return `
        SYSTEM INSTRUCTIONS
        You are summarizing a conversation between a user and an assistant.  
        
        CRITICAL REQUIREMENTS:  
        - Be shorter than the original text.  
        - Capture only the key points needed for context.  
        - Not include details about future messages that have not yet occurred.  
        - Avoid hallucinating or inventing content.  
        - Avoid copying entire messages verbatim.  

        CONVERSATION SO FAR:  
        ${chatHistory}

        TASK:  
        Summarize the above conversation in 3–6 sentences, focusing only on the essential topics, decisions, or user requests that may be relevant later.
        Return your next response in strict JSON format:  
        {
        "reply": "..."
        }
        `;    
    }

    /**
     * Create the prompt for Gemini with hardwired preferences to continue conversations.
     * 
     * @param chatHistory conversation history so far
     * @param lastMessage most recent user prompt
     */
    private createConversationPrompt(chatHistory: string, lastMessage: string): string {
        return `
        SYSTEM INSTRUCTIONS:
        You are an AI assistant continuing a chat conversation.  
        - Respond naturally in the style of a helpful assistant.  
        - Use only the information from the conversation so far and your general knowledge.  
        - Do not repeat the entire history in your response.  
        - Do not reference this prompt or the system instructions.  
        - Keep the response concise and directly relevant to the user’s last message.  

        CONVERSATION SO FAR:
        ${chatHistory}

        USER'S LAST MESSAGE:
        ${lastMessage}

        TASK:  
        Write the assistant’s next reply.
        Return your next response in strict JSON format:  
        {
        "reply": "..."
        }
        `;    
    }

}