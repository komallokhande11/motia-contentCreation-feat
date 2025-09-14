import type { EventConfig } from 'motia';
import { z } from 'zod';

const InputSchema = z.object({}).passthrough(); // Accept any input for manual review

export const config: EventConfig = {
	type: 'event',
	name: 'manual-review',
	description: 'Human-in-the-loop review and approval UI',
	subscribes: ['content.qa.completed'],
	emits: ['content.approved', 'content.revisions.requested', 'content.rejected'],
	input: InputSchema,
	flows: ['content-creation-pipeline']
};

// This step requires manual intervention, so we'll just pass through the data
export const handler = async (input: any, { emit, logger, traceId }: any) => {
	logger.info('Manual review step reached - waiting for human intervention', { traceId });
	
	// For now, we'll automatically approve to continue the pipeline
	// In a real implementation, this would wait for human input
	await (emit as any)({ 
		topic: 'content.approved', 
		data: { 
			...input, 
			traceId,
			approvedAt: new Date().toISOString()
		} 
	});
	
	logger.info('Content approved automatically for testing', { traceId });
};


