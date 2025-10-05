import { Chat, LLMReply } from "./llmchat";

/**
 * Validates that an LLM response is non-empty and properly formatted.
 * 
 * @params raw response from LLM
 */
export function validateLLMResponse(raw: string): LLMReply {
    let parsed: any;

    try {
        const cleaned = cleanJSON(raw);
        parsed = JSON.parse(cleaned);
    } catch (err) {
        throw new Error(`❌ LLM response is not valid JSON: ${err}`);
    }

    if (typeof parsed !== "object" || parsed === null) {
        throw new Error("❌ LLM response is not a JSON object.");
    }

    if (!("reply" in parsed)) {
        throw new Error('❌ LLM response is missing required field: "reply".');
    }

    if (typeof parsed.reply !== "string") {
        throw new Error('❌ LLM response field "reply" must be a string.');
    }

    // Optional: check for unexpected extra fields
    const keys = Object.keys(parsed);
    if (keys.length > 1) {
        throw new Error(`❌ LLM response contains unexpected fields: ${keys.join(", ")}`);
    }

    return parsed as { reply: string };
}

/**
 * Validates that that summary is not longer too much longer than the initial conversation.
 * 
 * @param summary result of summarizing chat conversation
 * @param chat chat that was summarized
 */
export function validateSummaryLength(summary: string, chat: Chat): void {
    const totalLength = chat.messages.reduce((sum, m) => sum + m.content.length, 0);
    const maxLength = Math.max(totalLength, 1) * 2;
    if (summary.length > maxLength) {
        throw new Error(
            `❌ Summary is longer than the conversation itself. Summary length: ${summary.length}, conversation length: ${totalLength}`
        );
    }
}

/**
 * Helper function for parsing JSON response
 * 
 * @param raw raw response from LLM
 * @returns parsed response form LLM
 */
function cleanJSON(raw: string): string {
    // Remove triple backticks and optional "json" label
    return raw.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
}