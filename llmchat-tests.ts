/**
 * LLMChat Test Cases
 * 
 * Demonstrates user actions with LLM augmentation:
 *  - creating and chatting in a new conversation
 *  - continuing an existing conversation
 *  - renaming, chatting with, and deleting a conversation
 */

import { LLMChat } from './llmchat';
import { GeminiLLM, Config } from './gemini-llm';

/**
 * Load configuration from config.json
 */
function loadConfig(): Config {
    try {
        const config = require('../config.json');
        return config;
    } catch (error) {
        console.error('❌ Error loading config.json. Please ensure it exists with your API key.');
        console.error('Error details:', (error as Error).message);
        process.exit(1);
    }
}


/**
 * Test case 1: Initialize new chat and ask a medical question
 * Demonstrates ability to start a new question and prompt it with a single question.
 */
export async function testNewChat(): Promise<void> {
    console.log('\n🧪 TEST CASE 1: Initialize new medical chat');
    console.log('===========================================');

    const llmChat = new LLMChat();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    const chat = llmChat.makeChat("Diabetes Inquiry");
    if (llmChat.getChats().length != 1) { throw new Error("Expected chat to be created"); }


    // Single-turn medical question
    console.log('Asking "What are the common symptoms of diabetes?"');
    await llmChat.sendMessage(chat, "What are the common symptoms of diabetes?", llm);
    console.log("Received response");

    // Update summary
    console.log("Generating summary")
    await llmChat.updateSummary(chat, llm);
    console.log("Received response");

    llmChat.printChat(chat);

}

/**
 * Test case 2: Continue an ongoing medical conversation.
 * Demonstrates ability to start a conversation and ask it multiple questions within a conversation.
 */
export async function testFollowup(): Promise<void> {
    console.log('\n🧪 TEST CASE 2: Continue an ongoing medical conversation');
    console.log('========================================================');

    const llmChat = new LLMChat();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    const chat = llmChat.makeChat("Diabetes Deep Dive");
    if (llmChat.getChats().length != 1) { throw new Error("Expected chat to be created"); }


    // Seed chat
    console.log('Asking "Who is at higher risk for Type 2 diabetess?"');
    await llmChat.sendMessage(chat, "Who is at higher risk for Type 2 diabetes?", llm);
    console.log("Received response");

    // Multi-turn follow-ups
    console.log('Asking "Can you also explain the differences between Type 1 and Type 2 diabetes?"');
    let response = await llmChat.sendMessage(chat, "Can you also explain the differences between Type 1 and Type 2 diabetes?", llm);
    console.log("Received response");

    console.log('Asking "What lifestyle changes can help manage diabetes?"');
    response = await llmChat.sendMessage(chat, "What lifestyle changes can help manage diabetes?", llm);
    console.log("Received response");

    // Update summary
    console.log("Generating summary")
    await llmChat.updateSummary(chat, llm);
    console.log("Received response");

    llmChat.printChat(chat);
}

/**
 * Test case 3: Rename, chat, and delete a conversation with complex medical query
 * Demonstrates ability to create a chat, rename the chat, ask it a question, summarize it, and delete the chat.
 */
export async function testRenameAndDeleteChat(): Promise<void> {
    console.log('\n🧪 TEST CASE 3: Rename, chat, and delete medical conversation');
    console.log('=============================================================');

    const llmChat = new LLMChat();
    const config = loadConfig();
    const llm = new GeminiLLM(config);

    const chat = llmChat.makeChat("Temporary Medical Chat");
    if (llmChat.getChats().length != 1) { throw new Error("Expected chat to be created"); }

    console.log('📂 Created chat: "Temporary Medical Chat"');

    // Rename
    llmChat.renameChat(chat, "Diabetes Complications");
    if (chat.name != "Diabetes Complications") { throw new Error("Expected chat to be renamed"); }

    console.log('✏️ Chat renamed to: "Diabetes Complications"');

    // Send complex query
    console.log('Asking "List the potential complications of poorly controlled diabetes."');
    await llmChat.sendMessage(chat, "List the potential complications of poorly controlled diabetes.", llm);
    console.log("Received response");

    // Update summary
    console.log("Generating summary")
    await llmChat.updateSummary(chat, llm);
    console.log("Received summary");

    llmChat.printChat(chat);

    // Delete
    llmChat.deleteChat(chat);
    if (llmChat.getChats().includes(chat)) { throw new Error("Expected chat to be deleted"); }
    console.log('🗑️ Chat deleted successfully');
}



/**
 * Main function to run all test cases
 */
async function main(): Promise<void> {
    console.log('🎓 LLMChat Test Suite');
    console.log('========================\n');
    
    try {
        // Run manual scheduling test
        await testNewChat();
        
        // Run LLM scheduling test
        await testFollowup();
        
        // Run mixed scheduling test
        await testRenameAndDeleteChat();
        
        console.log('\n🎉 All test cases completed successfully!');
        
    } catch (error) {
        console.error('❌ Test error:', (error as Error).message);
        process.exit(1);
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    main();
}
