import { type EventConfig, type Handlers } from 'motia';
import { 
	PlatformContentSchema, 
	AudienceSchema, 
	QAResultSchema,
	type ContentGenerationCompletedData,
	type ContentQACompletedData,
	type ContentQAFailedData,
	type QAResult
} from '../types/shared';
import { z } from 'zod';

const InputSchema = z.object({
	platformContents: PlatformContentSchema.refine(v => Object.keys(v).length > 0, 'At least one platform content is required'),
	context: z.object({
		topic: z.string(),
		audience: AudienceSchema
	})
});

export const config: EventConfig = {
	type: 'event',
	name: 'quality-assurance',
	description: 'Automated fact-checking, plagiarism, sentiment, and compliance checks',
	subscribes: ['content.generation.completed'],
	emits: ['content.qa.completed', { topic: 'content.qa.failed' }],
	input: InputSchema,
	flows: ['content-creation-pipeline']
};

// Simple utility placeholders; replace with real implementations/services.
async function factCheck(text: string): Promise<QAResult['factCheck']> {
	// Call external fact-checking API here
	return { passed: true, score: 0.92 };
}

async function plagiarismScore(text: string): Promise<number> {
	// Call plagiarism/originality service
	return 0.03; // 3% similarity
}

async function sentiment(text: string): Promise<QAResult['sentiment']> {
	return 'positive';
}

async function brandCompliance(text: string): Promise<QAResult['brandCompliance']> {
	return { passed: true, issues: [] };
}

export const handler = async (input: z.infer<typeof InputSchema>, { emit, logger, traceId }: any) => {
	try {
		const results: Record<string, QAResult> = {};
		const contents: Array<[string, string]> = [];
		
		if (input.platformContents.blog) contents.push(['blog', input.platformContents.blog]);
		if (input.platformContents.linkedin) contents.push(['linkedin', input.platformContents.linkedin]);
		if (input.platformContents.newsletter) contents.push(['newsletter', input.platformContents.newsletter]);
		if (input.platformContents.twitter) {
			input.platformContents.twitter.forEach((t: string, i: number) => contents.push([`twitter_${i}`, t]));
		}

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
		
		const failed = Object.values(results).some(r => 
			!r.factCheck.passed || r.plagiarism > 0.2 || !r.brandCompliance.passed
		);
		
		if (failed) {
			const failedData: ContentQAFailedData = { results, context: input.context, traceId };
			await emit({ topic: 'content.qa.failed', data: failedData } as any);
			logger.warn('QA failed', { traceId });
			return;
		}

		const completedData: ContentQACompletedData = { 
			results, 
			context: input.context, 
			traceId,
			platformContents: input.platformContents
		};
		await emit({ topic: 'content.qa.completed', data: completedData } as any);
		logger.info('QA completed', { traceId });
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Unknown error';
		logger.error('QA step error', { traceId, error: errorMessage });
		
		const failedData: ContentQAFailedData = { 
			error: errorMessage, 
			context: input.context, 
			traceId 
		};
		await emit({ topic: 'content.qa.failed', data: failedData } as any);
	}
};


