import { type EventConfig, type StepHandler } from 'motia';
import { z } from 'zod';

const InputSchema = z.object({
	platformContents: z.object({
		blog: z.string().optional(),
		twitter: z.array(z.string()).optional(),
		linkedin: z.string().optional(),
		newsletter: z.string().optional()
	}).partial().refine(v => Object.keys(v).length > 0, 'At least one platform content is required'),
	context: z.object({
		topic: z.string(),
		audience: z.object({ persona: z.string(), language: z.string(), readingLevel: z.string() })
	})
});

export const config: EventConfig<typeof InputSchema> = {
	type: 'event',
	name: 'quality-assurance',
	description: 'Automated fact-checking, plagiarism, sentiment, and compliance checks',
	subscribes: ['content.generation.completed'],
	emits: ['content.qa.completed', { topic: 'content.qa.failed' }],
	input: InputSchema,
	flows: ['content-creation-pipeline']
};

// Simple utility placeholders; replace with real implementations/services.
async function factCheck(text: string): Promise<{ passed: boolean; score: number }>{
	// Call external fact-checking API here
	return { passed: true, score: 0.92 };
}
async function plagiarismScore(text: string): Promise<number> {
	// Call plagiarism/originality service
	return 0.03; // 3% similarity
}
async function sentiment(text: string): Promise<'negative'|'neutral'|'positive'> {
	return 'positive';
}
async function brandCompliance(text: string): Promise<{ passed: boolean; issues: string[] }>{
	return { passed: true, issues: [] };
}

export const handler: StepHandler<typeof config> = async (input, { emit, logger, traceId }) => {
	try {
		const results: Record<string, any> = {};
		const contents: Array<[string, string]> = [];
		if (input.platformContents.blog) contents.push(['blog', input.platformContents.blog]);
		if (input.platformContents.linkedin) contents.push(['linkedin', input.platformContents.linkedin]);
		if (input.platformContents.newsletter) contents.push(['newsletter', input.platformContents.newsletter]);
		if (input.platformContents.twitter) input.platformContents.twitter.forEach((t, i) => contents.push([`twitter_${i}`, t]));

		for (const [key, text] of contents) {
			const [fc, plag, sent, brand] = await Promise.all([
				factCheck(text),
				plagiarismScore(text),
				sentiment(text),
				brandCompliance(text)
			]);
			results[key] = { factCheck: fc, plagiarism: plag, sentiment: sent, brandCompliance: brand };
		}

		logger.info('QA intermediate results', { traceId, results });
		const failed = Object.values(results).some((r: any) => !r.factCheck.passed || r.plagiarism > 0.2 || r.brandCompliance.passed === false);
		if (failed) {
			await emit({ topic: 'content.qa.failed', data: { results, context: input.context, traceId } });
			logger.warn('QA failed', { traceId });
			return;
		}

		await emit({ topic: 'content.qa.completed', data: { results, context: input.context, traceId } });
		logger.info('QA completed', { traceId });
	} catch (error: any) {
		logger.error('QA step error', { traceId, error: error?.message });
		await emit({ topic: 'content.qa.failed', data: { error: String(error), context: input?.context, traceId } });
	}
};


