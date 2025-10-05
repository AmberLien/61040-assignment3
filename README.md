# Assignment 3: An AI-Augmented Concept

Below, you can find written responses to assignment 3.

- The main code for the AI-augmented concept (described below) can be found in [llmchat.ts](llmchat.ts)
- Additional helper validator code can be found in [validator.ts](validator.ts)
- Test cases and the test driver for the AI-augmented concept can be found in [llmchat-tests.ts](llmchat-tests.ts)
- A dedicated page for the AI-augmented concept can be found in [llmchat.spec](llmchat.spec)

To run the test cases, simply run `npm start` or `npm test` in the project's repository.

## Original Concept

**concept** Chat \[User\]

**purpose** engage in a conversation

**principle** a user starts a new chat, exchanges messages with an LLM, and can save, rename, or delete the conversation

**state**

- a set of Chats with
  - an owner User
  - a name String
  - a messages List
- a messages List with
  - a role String
  - a content String
  - a timestamp Date

**action**

- `makeChat(sessionToken: String, name: String): (chat: Chat)`
  - requires:
    - sessionToken is valid
  - effects: returns a new chat with the provided name and makes the owner the session user
- `sendMessage(sessionToken: String, chat: Chat, content: String)`
  - requires:
    - sessionToken is valid
    - chat exists
    - chat owner is the session user
  - effects:
    - appends a message with role "user" to the chat's message list
- `receiveResponse(sessionToken: String, chat: Chat)`
  - requires:
    - sessionToken is valid
    - chat exists
    - chat owner is the session user
  - effects:
    - appends a new message with role "llm" to the chat's message list
- `deleteChat(sessionToken: String, chat: Chat)`
  - requires:
    - sessionToken is valid
    - chat exists
    - chat owner is the session user
  - effects:
    - deletes the chat conversation
- `renameChat(sessionToken: String, chat: Chat, newName: String)`
  - requires:
    - sessionToken is valid
    - chat exists
    - chat owner is the session user
  - effects: changes name of chat to newName

## AI-Augmented Concept

**concept** LLMChat \[User\]

**purpose** engage in a conversation with a large language model (LLM)

**principle** a user starts a new chat, exchanges messages with an LLM, and can save, rename, or delete the conversation; a user can choose to continue the conversation by having the LLM automatically summarize discussions

**state**

- a set of Chats with
  - an owner User
  - a name String
  - a messages List
  - a summary String
  - a history String
- a messages List with
  - a role String
  - a content String
  - a timestamp Number

**action**

- `makeChat(sessionToken: String, name: String): (chat: Chat)`
  - requires:
    - sessionToken is valid
  - effects: returns a new chat with the provided name and makes the owner the session user
- `sendMessage(sessionToken: String, chat: Chat, content: String, llm: GeminiLLM)`
  - requires:
    - sessionToken is valid
    - chat and llm exist
    - chat owner is the session user
  - effects:
    - appends a message with role "user" to the chat's message list
    - uses llm to ask about provided content
    - appends a new message with role "llm" to the chat's message list from the response
    - updates chat history
- `deleteChat(sessionToken: String, chat: Chat)`
  - requires:
    - sessionToken is valid
    - chat exists
    - chat owner is the session user
  - effects:
    - deletes the chat conversation
- `renameChat(sessionToken: String, chat: Chat, newName: String)`
  - requires:
    - sessionToken is valid
    - chat exists
    - chat owner is the session user
  - effects: changes name of chat to newName
- `updateSummary(chat: Chat, llm: GeminiLLM)`
  - requires:
    - chat exists
  - effects:
    - uses LLM to re-summarize the conversation so far and updates the summary state to reflect this

## User-Interaction

See [user_interaction.md](user_interaction.md) for updated user interactions. Note that the UI mostly stays the same as in the previous assignment, with updates occurring on the AskMedi page. A summarization tab is now provided with a button to summarize information.

## Test Cases and Validators

See [notes.md](notes.md) for discussions on the test cases created and validators created.
