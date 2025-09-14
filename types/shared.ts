import { z } from 'zod';

// Platform content types
export const PlatformContentSchema = z.object({
	blog: z.string().optional(),
	twitter: z.array(z.string()).optional(),
	linkedin: z.string().optional(),
	newsletter: z.string().optional()
}).partial();

export const AudienceSchema = z.object({
	persona: z.string().min(2),
	language: z.string().default('en'),
	readingLevel: z.enum(['beginner', 'intermediate', 'expert']).default('intermediate')
}).transform(data => ({
	...data,
	language: data.language || 'en',
	readingLevel: data.readingLevel || 'intermediate'
}));

export const ContentRequestSchema = z.object({
	topic: z.string().min(3).optional(),
	sourceUrl: z.string().url().optional(),
	targetPlatforms: z.array(z.enum(['blog', 'twitter', 'linkedin', 'newsletter'])).min(1),
	urgency: z.enum(['low', 'normal', 'high']).default('normal'),
	audience: AudienceSchema
}).strict();

// QA result types
export const QAResultSchema = z.object({
	factCheck: z.object({
		passed: z.boolean(),
		score: z.number().min(0).max(1)
	}),
	plagiarism: z.number().min(0).max(1),
	sentiment: z.enum(['negative', 'neutral', 'positive']),
	brandCompliance: z.object({
		passed: z.boolean(),
		issues: z.array(z.string())
	})
});

export const QAResultsSchema = z.record(z.string(), QAResultSchema);

// Publishing result types
export const PublishingResultSchema = z.object({
	wp: z.object({ id: z.string().nullable() }),
	li: z.object({ id: z.string().nullable() }),
	tw: z.array(z.object({ id: z.string(), text: z.string() })),
	md: z.object({ id: z.string().nullable() })
});

// Strategy types
export const StrategySuggestionsSchema = z.object({
	topics: z.array(z.string()),
	recommendations: z.array(z.string())
});

// Export inferred types
export type PlatformContent = z.infer<typeof PlatformContentSchema>;
export type Audience = z.infer<typeof AudienceSchema>;
export type ContentRequest = z.infer<typeof ContentRequestSchema>;
export type QAResult = z.infer<typeof QAResultSchema>;
export type QAResults = z.infer<typeof QAResultsSchema>;
export type PublishingResult = z.infer<typeof PublishingResultSchema>;
export type StrategySuggestions = z.infer<typeof StrategySuggestionsSchema>;

// Event data types
export interface ContentRequestReceivedData {
	topic?: string;
	sourceUrl?: string;
	targetPlatforms: ('blog' | 'twitter' | 'linkedin' | 'newsletter')[];
	urgency: 'low' | 'normal' | 'high';
	audience: Audience;
	traceId: string;
}

export interface ContentGenerationCompletedData {
	platformContents: PlatformContent;
	context: {
		topic: string;
		audience: Audience;
	};
}

export interface ContentQACompletedData {
	results: QAResults;
	context: {
		topic: string;
		audience: Audience;
	};
	platformContents: PlatformContent;
	traceId: string;
}

export interface ContentQAFailedData {
	results?: QAResults;
	error?: string;
	context?: {
		topic: string;
		audience: Audience;
	};
	traceId: string;
}

export interface ContentPublishedData {
	scheduledAt: string;
	results: PublishingResult;
	metadata: {
		topic: string;
		audience: {
			persona: string;
			language: string;
		};
	};
	traceId: string;
}

export interface StrategyUpdateCompletedData {
	suggestions: StrategySuggestions;
	insights?: unknown;
}
