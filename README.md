# OpenAI-Compatible Workers AI Worker

This Cloudflare Worker provides OpenAI-compatible API endpoints using Workers AI as the backend. You can use the same OpenAI SDK code but with Cloudflare's AI models instead of OpenAI's.

## Features

- ✅ **OpenAI SDK Compatible**: Use the official OpenAI Node.js SDK
- ✅ **Chat Completions**: `/v1/chat/completions` endpoint
- ✅ **Embeddings**: `/v1/embeddings` endpoint  
- ✅ **Models List**: `/v1/models` endpoint
- ✅ **CORS Enabled**: Works from browsers and web applications
- ✅ **Error Handling**: Proper error responses and logging
- ✅ **Multiple Models**: Support for various Cloudflare AI models

## Quick Start

### 1. Deploy the Worker

```bash
npm run deploy
```

### 2. Use with OpenAI SDK

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: 'dummy-key', // Not required for Workers AI
  baseURL: 'https://your-worker.your-subdomain.workers.dev'
});

// Chat completion
const completion = await openai.chat.completions.create({
  messages: [{ role: 'user', content: 'Hello!' }],
  model: '@cf/meta/llama-3.1-8b-instruct'
});

// Embeddings
const embeddings = await openai.embeddings.create({
  model: '@cf/baai/bge-large-en-v1.5',
  input: 'Hello world'
});
```

### 3. Use with Direct HTTP Requests

```bash
# Chat completion
curl -X POST https://your-worker.your-subdomain.workers.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "@cf/meta/llama-3.1-8b-instruct",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# Embeddings
curl -X POST https://your-worker.your-subdomain.workers.dev/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "model": "@cf/baai/bge-large-en-v1.5",
    "input": "Hello world"
  }'
```

## Available Endpoints

### `GET /`
Returns API information and available endpoints.

### `GET /v1/models`
Lists available AI models.

### `POST /v1/chat/completions`
Chat completion endpoint compatible with OpenAI's API.

**Request Body:**
```json
{
  "model": "@cf/meta/llama-3.1-8b-instruct",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "max_tokens": 150,
  "temperature": 0.7
}
```

### `POST /v1/embeddings`
Text embeddings endpoint compatible with OpenAI's API.

**Request Body:**
```json
{
  "model": "@cf/baai/bge-large-en-v1.5",
  "input": "Text to embed"
}
```

## Supported Models

### Chat Models
- `@cf/meta/llama-3.1-8b-instruct` (default)
- `@cf/meta/llama-3.1-70b-instruct`
- `@cf/meta/llama-3-8b-instruct`

### Embedding Models
- `@cf/baai/bge-large-en-v1.5` (default)
- `@cf/baai/bge-base-en-v1.5`

## Development

### Local Development

```bash
npm run dev
```

This starts a local development server at `http://localhost:8787`.

### Testing

Run the example client to test your worker:

```bash
# Update the WORKER_URL in example-client.js first
node example-client.js
```

### Project Structure

```
openai-worker/
├── src/
│   └── index.ts          # Main worker code
├── example-client.js     # Example usage with OpenAI SDK
├── wrangler.jsonc        # Cloudflare Worker configuration
├── package.json          # Dependencies
└── README.md            # This file
```

## Configuration

The worker is configured in `wrangler.jsonc`:

```json
{
  "name": "openai-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-05-25",
  "ai": {
    "binding": "AI"
  }
}
```

## Error Handling

The worker includes comprehensive error handling:

- **400 Bad Request**: Invalid request parameters
- **405 Method Not Allowed**: Wrong HTTP method
- **404 Not Found**: Unknown endpoint
- **500 Internal Server Error**: AI model errors or other issues

## CORS Support

The worker includes CORS headers to allow requests from web browsers:

```javascript
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

## Differences from OpenAI API

1. **No API Key Required**: Workers AI doesn't require authentication when using the worker
2. **Model Names**: Use Cloudflare model identifiers (e.g., `@cf/meta/llama-3.1-8b-instruct`)
3. **Token Counts**: Usage statistics return 0 as Workers AI doesn't provide token counts
4. **Streaming**: Streaming responses are supported but may behave differently

## Deployment

1. **Install Wrangler**: `npm install -g wrangler`
2. **Login**: `wrangler login`
3. **Deploy**: `npm run deploy`

Your worker will be available at `https://openai-worker.your-subdomain.workers.dev`.

## Resources

- [Cloudflare Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- [OpenAI Compatibility Guide](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)

## License

MIT 