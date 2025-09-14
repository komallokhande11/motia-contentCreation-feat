import { type EventConfig, type Handlers } from 'motia';
import { 
	PlatformContentSchema, 
	type ContentPublishedData,
	type PublishingResult
} from '../types/shared';
import { z } from 'zod';

const InputSchema = z.object({
	platformContents: PlatformContentSchema,
	context: z.object({
		topic: z.string(),
		audience: z.object({
			persona: z.string(),
			language: z.string(),
			readingLevel: z.string().optional()
		})
	}).optional(),
	schedule: z.object({ when: z.string().datetime().optional() }).optional(),
	metadata: z.object({ 
		topic: z.string(), 
		audience: z.object({ 
			persona: z.string(), 
			language: z.string() 
		}) 
	}).optional()
});

export const config: EventConfig = {
	type: 'event',
	name: 'multi-platform-publisher',
	description: 'Publishes content to WordPress, LinkedIn, Twitter, Medium with scheduling',
	subscribes: ['content.approved'],
	emits: ['content.published'],
	input: InputSchema,
	flows: ['content-creation-pipeline']
};

async function publishWordPress(content?: string): Promise<{ id: string | null }> { 
	if (!content) return { id: null }; 
	return { id: 'wp_' + Date.now() }; 
}

async function publishLinkedIn(content?: string): Promise<{ id: string | null }> { 
	if (!content) return { id: null }; 
	return { id: 'li_' + Date.now() }; 
}

async function publishTwitter(tweets?: string[]): Promise<Array<{ id: string; text: string }>> { 
	if (!tweets?.length) return []; 
	return tweets.map((t, i) => ({ id: `tw_${Date.now()}_${i}`, text: t })); 
}

async function publishMedium(content?: string): Promise<{ id: string | null }> { 
	if (!content) return { id: null }; 
	return { id: 'md_' + Date.now() }; 
}

export const handler: Handlers['multi-platform-publisher'] = async (input: z.infer<typeof InputSchema>, { emit, logger, traceId }: any) => {
	try {
		// naive scheduling placeholder; real scheduling would enqueue jobs at desired time
		const scheduled = input.schedule?.when ? new Date(input.schedule.when).toISOString() : new Date().toISOString();
		
		const [wp, li, tw, md] = await Promise.all([
			publishWordPress(input.platformContents.blog),
			publishLinkedIn(input.platformContents.linkedin),
			publishTwitter(input.platformContents.twitter),
			publishMedium(input.platformContents.blog)
		]);

		const results: PublishingResult = { wp, li, tw, md };
		const eventData: ContentPublishedData = { 
			scheduledAt: scheduled, 
			results, 
			metadata: input.metadata || { 
				topic: input.context?.topic || 'Unknown', 
				audience: input.context?.audience || { persona: 'Unknown', language: 'en' } 
			}, 
			traceId 
		};

		await (emit as any)({ topic: 'content.published', data: eventData });
		logger.info('Content published across platforms', { traceId, platforms: Object.keys(input.platformContents) });
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		logger.error('Publishing failed', { traceId, error: errorMessage });
		throw error;
	}
};


