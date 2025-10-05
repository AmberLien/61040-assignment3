# Test Case Explanation

Because my concept is used to implement a chatbot, the prompts inputted depend on the user's questions. Since Gemini's API doesn't retain context by default, I maintained an ongoing message list between user and LLM, which was passed as context for each conversation. Initially, I created a prompt that only included the chat conversation and the new input, forcing the LLM to extrapolate that it should respond:

## First Prompt:

```
const prompt = `${history}\n\n${content}`; // content is the new user prompt
```

Note the lack of instructions in this initial prompt. This led to issues whenever content wasn't necessarily in a question format as it answered with less focus as shown in Test Case 3 where one of the user prompts was "List the potential complications of poorly controlled diabetes.".

- What worked: A response was always returned.
- What was broken: The content and style of the response varied wildly, and the formatting was unpredictable.

To improve this, I revised the prompt to provide better context: first specifying the overarching task, then including the conversation context.

## Second Prompt:

```
/**
* Create the prompt for Gemini with hardwired preferences to continue conversations.
*
* @param chatHistory conversation history so far
* @param lastMessage most recent user prompt
*/
private createConversationPrompt(chatHistory: string, lastMessage: string): string {
    return`
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
        Respond to the above conversation in 3–6 sentences, focusing only on the essential topics, decisions, or user requests that may be relevant later.
        `;

  }
```

While performing with more accurate outputs, they were still inconsistently returned. Some were structured in bullet points. Others in plaintext or JSON.

- What improved: Responses were more focused and better aligned with the user’s last message.
- What was still broken: The format and length of responses were inconsistent, sometimes ignoring the sentence guideline or adding extra commentary.

I determined that standardizing the LLM's output format was essential, so I updated the prompt again with explicit instructions, constraints, and a required JSON structure for responses. This final adjustment ensured more reliable and predictable outputs while still accommodating user-driven conversation.

## Third Prompt:

```

/**
* Create the prompt for Gemini with hardwired preferences to continue conversations.
*
* @param chatHistory conversation history so far
* @param lastMessage most recent user prompt
*/
private createConversationPrompt(chatHistory: string, lastMessage: string): string {
    return`
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
```

By requiring a strict JSON structure, I eliminated formatting inconsistencies. The chatbot could now reliably produce outputs that were both parseable and user-friendly.

- What improved: Outputs became consistent, predictable, and easy to validate.
- What remains broken: Some responses were still verbose or stylistically varied, since LLMs are imperfect at following exact tone constraints.

# Validator Explanation

I implemented three validators to handle plausible issues with LLM outputs. First, a structural validator ensures that the returned JSON contains a non-empty `reply`, preventing confusing blank outputs and wasted memory if the LLM misfires. This validator can be found in [validator.ts](validator.ts) as `validateLLMResponse`. Second, a validator prevents summaries from being generated when a chat has no messages, which would be illogical since there is no conversation to summarize. This can be found in [llmchat.ts](llmchat.ts) in the `updateSummary` function. Third, a summary-length validator caps the summary to twice the length of the conversation history, allowing some leeway for LLM tokenization while preventing summaries from being excessively long relative to the original chat. This can be found in [validator.ts](validator.ts) as in `validateSummaryLength`. Together, these validators catch realistic failures, provide actionable errors, and help maintain both logical consistency and efficiency in the system.
