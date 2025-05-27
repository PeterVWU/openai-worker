import OpenAI from 'openai';

/**
 * Example client showing how to use the OpenAI SDK with your Workers AI worker
 * 
 * To use this:
 * 1. Deploy your worker: npm run deploy
 * 2. Replace YOUR_WORKER_URL with your actual worker URL
 * 3. Run this script: node example-client.js
 */

// Replace with your actual worker URL after deployment
const WORKER_URL = 'https://openai-worker.your-subdomain.workers.dev';

// Initialize OpenAI client pointing to your worker
const openai = new OpenAI({
  apiKey: 'dummy-key', // Workers AI doesn't require a real API key when using the worker
  baseURL: WORKER_URL,
});

async function testChatCompletion() {
  console.log('🤖 Testing chat completion...');
  
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Explain quantum computing in simple terms.' }
      ],
      model: '@cf/meta/llama-3.1-8b-instruct',
      max_tokens: 150
    });

    console.log('✅ Chat completion response:');
    console.log(chatCompletion.choices[0].message.content);
    console.log('\n');
  } catch (error) {
    console.error('❌ Chat completion error:', error.message);
  }
}

async function testEmbeddings() {
  console.log('🔍 Testing embeddings...');
  
  try {
    const embeddings = await openai.embeddings.create({
      model: '@cf/baai/bge-large-en-v1.5',
      input: 'I love working with Cloudflare Workers!'
    });

    console.log('✅ Embeddings response:');
    console.log(`Generated embedding with ${embeddings.data[0].embedding.length} dimensions`);
    console.log('First 5 values:', embeddings.data[0].embedding.slice(0, 5));
    console.log('\n');
  } catch (error) {
    console.error('❌ Embeddings error:', error.message);
  }
}

async function testModels() {
  console.log('📋 Testing models list...');
  
  try {
    const models = await openai.models.list();
    
    console.log('✅ Available models:');
    models.data.forEach(model => {
      console.log(`- ${model.id}`);
    });
    console.log('\n');
  } catch (error) {
    console.error('❌ Models list error:', error.message);
  }
}

async function runExamples() {
  console.log('🚀 Testing OpenAI SDK with Workers AI\n');
  
  await testModels();
  await testChatCompletion();
  await testEmbeddings();
  
  console.log('✨ All tests completed!');
}

// Alternative: Direct fetch examples (without OpenAI SDK)
async function directFetchExamples() {
  console.log('🔧 Direct fetch examples:\n');
  
  // Chat completion with fetch
  try {
    const response = await fetch(`${WORKER_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: '@cf/meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'user', content: 'What is the capital of France?' }
        ]
      })
    });
    
    const data = await response.json();
    console.log('✅ Direct fetch chat completion:');
    console.log(data.choices[0].message.content);
    console.log('\n');
  } catch (error) {
    console.error('❌ Direct fetch error:', error.message);
  }
}

// Run the examples
if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
  // Uncomment to also run direct fetch examples:
  // directFetchExamples().catch(console.error);
} 