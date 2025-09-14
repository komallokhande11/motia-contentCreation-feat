import type { EventConfig, Handlers } from 'motia';
import { z } from 'zod';

const InputSchema = z.object({}).passthrough();

export const config: EventConfig = {
	type: 'event',
	name: 'manual-review',
	description: 'Manual review step - requires human approval',
	subscribes: ['content.qa.completed'],
	emits: ['content.approved', 'content.rejected'],
	input: InputSchema,
	flows: ['content-creation-pipeline']
};

export const handler: Handlers['manual-review'] = async (input: any, { emit, logger, traceId, state }: any) => {
	logger.info('Manual review step reached', { traceId });
	
	// Store content for review
	await state.set(traceId, 'manual-review.content', {
		platformContents: input.platformContents,
		context: input.context,
		qaResults: input.results,
		submittedAt: new Date().toISOString()
	});
	
	logger.info('Content ready for manual review', { 
		traceId, 
		platforms: Object.keys(input.platformContents || {}),
		topic: input.context?.topic
	});
	
	// Simple quality check
	const hasContent = input.platformContents && Object.keys(input.platformContents).length > 0;
	const hasValidContent = hasContent && Object.values(input.platformContents).some((content: any) => 
		typeof content === 'string' ? content.length > 50 : 
		Array.isArray(content) ? content.length > 0 : false
	);
	
	if (!hasValidContent) {
		logger.warn('Content rejected - insufficient content', { traceId });
		await (emit as any)({ 
			topic: 'content.rejected', 
			data: { 
				...input, 
				traceId,
				rejectedAt: new Date().toISOString(),
				reason: 'Insufficient content quality'
			} 
		});
		return;
	}
	
	// For now, auto-approve after a short delay
	// In a real implementation, this would wait for human input
	logger.info('Auto-approving content after review', { traceId });
	await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
	
	await (emit as any)({ 
		topic: 'content.approved', 
		data: { 
			...input, 
			traceId,
			approvedAt: new Date().toISOString(),
			reviewedBy: 'auto-review'
		} 
	});
	
	logger.info('Content approved', { traceId });
};


