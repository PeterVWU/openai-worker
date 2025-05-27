/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import OpenAI from 'openai';

/**
 * Cloudflare Worker that provides OpenAI-compatible API endpoints
 * using Workers AI as the backend. This allows you to use the same
 * OpenAI SDK code but with Cloudflare's AI models.
 */

interface Env {
	AI: Ai;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Enable CORS for all requests
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		// Handle preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		const url = new URL(request.url);
		const path = url.pathname;

		try {
			// Route handling
			if (path === '/') {
				return new Response(
					JSON.stringify({
						message: 'OpenAI-compatible Workers AI API',
						endpoints: {
							chat: '/v1/chat/completions',
							embeddings: '/v1/embeddings',
							models: '/v1/models'
						},
						documentation: 'https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/'
					}),
					{
						headers: { 
							'Content-Type': 'application/json',
							...corsHeaders
						}
					}
				);
			}

			if (path === '/v1/models') {
				return handleModels(corsHeaders);
			}

			if (path === '/v1/chat/completions') {
				return await handleChatCompletions(request, env, corsHeaders);
			}

			if (path === '/v1/embeddings') {
				return await handleEmbeddings(request, env, corsHeaders);
			}

			// 404 for unknown paths
			return new Response(
				JSON.stringify({ error: 'Not found' }),
				{
					status: 404,
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders
					}
				}
			);

		} catch (error) {
			console.error('Error:', error);
			return new Response(
				JSON.stringify({ 
					error: 'Internal server error',
					message: error instanceof Error ? error.message : 'Unknown error'
				}),
				{
					status: 500,
					headers: { 
						'Content-Type': 'application/json',
						...corsHeaders
					}
				}
			);
		}
	},
} satisfies ExportedHandler<Env>;

async function handleChatCompletions(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	if (request.method !== 'POST') {
		return new Response(
			JSON.stringify({ error: 'Method not allowed' }),
			{
				status: 405,
				headers: { 
					'Content-Type': 'application/json',
					...corsHeaders
				}
			}
		);
	}

	const body = await request.json() as any;
	const { messages, model = '@cf/meta/llama-3.3-70b-instruct-fp8-fast', stream = false, ...otherParams } = body;

	if (!messages || !Array.isArray(messages)) {
		return new Response(
			JSON.stringify({ error: 'Messages array is required' }),
			{
				status: 400,
				headers: { 
					'Content-Type': 'application/json',
					...corsHeaders
				}
			}
		);
	}

	try {
		// Use Workers AI directly for better performance and native support
		const response = await env.AI.run(model, {
			messages,
			stream,
			...otherParams
		});

		// Format response to match OpenAI API structure
		const openaiResponse = {
			id: `chatcmpl-${Date.now()}`,
			object: 'chat.completion',
			created: Math.floor(Date.now() / 1000),
			model,
			choices: [
				{
					index: 0,
					message: {
						role: 'assistant',
						content: response.response || response
					},
					finish_reason: 'stop'
				}
			],
			usage: {
				prompt_tokens: 0, // Workers AI doesn't provide token counts
				completion_tokens: 0,
				total_tokens: 0
			}
		};

		return new Response(
			JSON.stringify(openaiResponse),
			{
				headers: { 
					'Content-Type': 'application/json',
					...corsHeaders
				}
			}
		);

	} catch (error) {
		console.error('Chat completion error:', error);
		return new Response(
			JSON.stringify({ 
				error: 'Failed to generate completion',
				message: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { 
					'Content-Type': 'application/json',
					...corsHeaders
				}
			}
		);
	}
}

async function handleEmbeddings(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	if (request.method !== 'POST') {
		return new Response(
			JSON.stringify({ error: 'Method not allowed' }),
			{
				status: 405,
				headers: { 
					'Content-Type': 'application/json',
					...corsHeaders
				}
			}
		);
	}

	const body = await request.json() as any;
	const { input, model = '@cf/baai/bge-large-en-v1.5' } = body;

	if (!input) {
		return new Response(
			JSON.stringify({ error: 'Input is required' }),
			{
				status: 400,
				headers: { 
					'Content-Type': 'application/json',
					...corsHeaders
				}
			}
		);
	}

	try {
		// Handle both string and array inputs
		const inputs = Array.isArray(input) ? input : [input];
		const embeddings = [];

		for (let i = 0; i < inputs.length; i++) {
			const response = await env.AI.run(model, {
				text: inputs[i]
			});
			
			embeddings.push({
				object: 'embedding',
				embedding: response.data || response,
				index: i
			});
		}

		const openaiResponse = {
			object: 'list',
			data: embeddings,
			model,
			usage: {
				prompt_tokens: 0,
				total_tokens: 0
			}
		};

		return new Response(
			JSON.stringify(openaiResponse),
			{
				headers: { 
					'Content-Type': 'application/json',
					...corsHeaders
				}
			}
		);

	} catch (error) {
		console.error('Embeddings error:', error);
		return new Response(
			JSON.stringify({ 
				error: 'Failed to generate embeddings',
				message: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { 
					'Content-Type': 'application/json',
					...corsHeaders
				}
			}
		);
	}
}

function handleModels(corsHeaders: Record<string, string>): Response {
	const models = {
		object: 'list',
		data: [
			{
				id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
				object: 'model',
				created: 1677610602,
				owned_by: 'cloudflare'
			},
			{
				id: '@cf/meta/llama-3.1-70b-instruct',
				object: 'model',
				created: 1677610602,
				owned_by: 'cloudflare'
			},
			{
				id: '@cf/meta/llama-3-8b-instruct',
				object: 'model',
				created: 1677610602,
				owned_by: 'cloudflare'
			},
			{
				id: '@cf/baai/bge-large-en-v1.5',
				object: 'model',
				created: 1677610602,
				owned_by: 'cloudflare'
			},
			{
				id: '@cf/baai/bge-base-en-v1.5',
				object: 'model',
				created: 1677610602,
				owned_by: 'cloudflare'
			}
		]
	};

	return new Response(
		JSON.stringify(models),
		{
			headers: { 
				'Content-Type': 'application/json',
				...corsHeaders
			}
		}
	);
}
