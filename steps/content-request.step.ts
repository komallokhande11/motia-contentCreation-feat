import { type ApiRouteConfig, type ApiRouteHandler } from 'motia';
import { z } from 'zod';

const BodySchema = z.object({
	topic: z.string().min(3).optional(),
	sourceUrl: z.string().url().optional(),
	targetPlatforms: z.array(z.enum(['blog', 'twitter', 'linkedin', 'newsletter'])).min(1),
	urgency: z.enum(['low', 'normal', 'high']).default('normal'),
	audience: z.object({
		persona: z.string().min(2),
		language: z.string().default('en'),
		readingLevel: z.enum(['beginner', 'intermediate', 'expert']).default('intermediate')
	}).strict()
}).strict();

export const config: ApiRouteConfig = {
	type: 'api',
	name: 'content-request',
	description: 'Accepts content creation requests and kicks off the pipeline',
	path: '/api/content-request',
	method: 'POST',
	emits: ['content.request.received'],
	flows: ['content-creation-pipeline'],
	bodySchema: BodySchema
};

export const handler: ApiRouteHandler = async (req, { emit, logger, traceId, state }) => {
	try {
		const body = BodySchema.parse(req.body);
		// Persist the initial request for auditing and downstream usage
		await state.set(traceId, 'request', { ...body, receivedAt: new Date().toISOString() });

		await emit({
			topic: 'content.request.received',
			data: { ...body, traceId }
		});

		logger.info('Emitted content.request.received', { traceId, topic: body.topic });
		// Return richer 200 response similar to tutorial sample
		return {
			status: 200,
			body: {
				traceId,
				status: 'accepted',
				request: body
			}
		};
	} catch (error: any) {
		logger.error('Failed to accept content request', { traceId, error: error?.message });
		return { status: 400, body: { error: error?.message ?? 'Invalid request' } };
	}
};


