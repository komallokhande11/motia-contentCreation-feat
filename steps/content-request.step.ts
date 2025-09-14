import { type ApiRouteConfig, type Handlers } from 'motia';
import { ContentRequestSchema, type ContentRequestReceivedData } from '../types/shared';

export const config: ApiRouteConfig = {
	type: 'api',
	name: 'content-request',
	description: 'Accepts content creation requests and kicks off the pipeline',
	path: '/api/content-request',
	method: 'POST',
	emits: ['content.request.received'],
	flows: ['content-creation-pipeline'],
	bodySchema: ContentRequestSchema
};

export const handler: Handlers['content-request'] = async (req, { emit, logger, traceId, state }) => {
	try {
		const body = ContentRequestSchema.parse(req.body);
		// Persist the initial request for auditing and downstream usage
		await state.set(traceId, 'request', { ...body, receivedAt: new Date().toISOString() });

		const eventData: ContentRequestReceivedData = { 
			topic: body.topic,
			sourceUrl: body.sourceUrl,
			targetPlatforms: body.targetPlatforms,
			urgency: body.urgency,
			audience: body.audience,
			traceId 
		};
		await (emit as any)({
			topic: 'content.request.received',
			data: eventData
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
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		logger.error('Failed to accept content request', { traceId, error: errorMessage });
		return { status: 400, body: { error: errorMessage } };
	}
};


