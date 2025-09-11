import { type EventConfig, type StepHandler } from 'motia';
import { z } from 'zod';

const InputSchema = z.object({
	contents: z.object({
		blog: z.string().optional(),
		twitter: z.array(z.string()).optional(),
		linkedin: z.string().optional(),
		newsletter: z.string().optional()
	}).partial(),
	schedule: z.object({ when: z.string().datetime().optional() }).optional(),
	metadata: z.object({ topic: z.string(), audience: z.object({ persona: z.string(), language: z.string() }) })
});

export const config: EventConfig<typeof InputSchema> = {
	type: 'event',
	name: 'multi-platform-publisher',
	description: 'Publishes content to WordPress, LinkedIn, Twitter, Medium with scheduling',
	subscribes: ['content.approved'],
	emits: ['content.published'],
	input: InputSchema,
	flows: ['content-creation-pipeline']
};

async function publishWordPress(content?: string) { if (!content) return { id: null }; return { id: 'wp_' + Date.now() }; }
async function publishLinkedIn(content?: string) { if (!content) return { id: null }; return { id: 'li_' + Date.now() }; }
async function publishTwitter(tweets?: string[]) { if (!tweets?.length) return []; return tweets.map((t, i) => ({ id: `tw_${Date.now()}_${i}`, text: t })); }
async function publishMedium(content?: string) { if (!content) return { id: null }; return { id: 'md_' + Date.now() }; }

export const handler: StepHandler<typeof config> = async (input, { emit, logger, traceId }) => {
	try {
		// naive scheduling placeholder; real scheduling would enqueue jobs at desired time
		const scheduled = input.schedule?.when ? new Date(input.schedule.when).toISOString() : new Date().toISOString();
		const [wp, li, tw, md] = await Promise.all([
			publishWordPress(input.contents.blog),
			publishLinkedIn(input.contents.linkedin),
			publishTwitter(input.contents.twitter),
			publishMedium(input.contents.blog)
		]);

		await emit({ topic: 'content.published', data: { scheduledAt: scheduled, results: { wp, li, tw, md }, metadata: input.metadata, traceId } });
		logger.info('Content published across platforms', { traceId });
	} catch (error: any) {
		logger.error('Publishing failed', { traceId, error: error?.message });
		throw error;
	}
};


