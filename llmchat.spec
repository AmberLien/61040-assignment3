<concept_spec>
concept LLMChat [User]

purpose
    engage in a conversation with a large language model (LLM)

principle 
    a user starts a new chat, exchanges messages with an LLM, 
    and can save, rename, or delete the conversation; 
    a user can choose to continue the conversation by having 
    the LLM automatically summarize discussions

state
    a set of Chats with
        an owner User
        a name String
        a messages List
        a summary String
        a history String
    a messages List with
        a role String
        a content String
        a timestamp Number

    invariants
        every messages list is in the chat set

action
    makeChat(sessionToken: String, name: String): (chat: Chat)
        requires: sessionToken is valid
        effects: 
            returns a new chat with the provided name and makes the owner the session user
    
    sendMessage(sessionToken: String, chat: Chat, content: String, llm: GeminiLLM)
        requires:
            sessionToken is valid
            chat and llm exist
            chat owner is the session user
        effects:
            appends a message with role "user" to the chat's message list
            uses llm to ask about provided content
            appends a new message with role "llm" to the chat's message list from the response
            updates chat history

    deleteChat(sessionToken: String, chat: Chat)
        requires:
            sessionToken is valid
            chat exists
            chat owner is the session user
        effects:
            deletes the chat conversation
    
    renameChat(sessionToken: String, chat: Chat, newName: String)
        requires:
            sessionToken is valid
            chat exists
            chat owner is the session user
        effects: 
            changes name of chat to newName
    
    updateSummary(chat: Chat, llm: GeminiLLM)
        requires: 
            chat exists
        effects:
            uses LLM to re-summarize the conversation so far and updates the summary state to reflect this

</concept_spec>