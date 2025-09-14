import { type CronConfig, type Handlers } from 'motia';
import { type StrategyUpdateCompletedData, StrategySuggestionsSchema } from '../types/shared';

export const config: CronConfig = {
	type: 'cron',
	name: 'strategy-optimizer',
	description: 'Daily analysis to generate content strategy updates',
	cron: '0 7 * * *',
	emits: ['strategy.update.completed'],
	flows: ['content-creation-pipeline']
};

export const handler: Handlers['strategy-optimizer'] = async ({ emit, logger, state, traceId }) => {
	// pull aggregated performance insights if present
	const insights = await state.get(traceId, 'performance.insights');
	
	const suggestions = StrategySuggestionsSchema.parse({
		topics: ['AI policy updates', 'LLM evaluation best practices'],
		recommendations: ['Post threads at 9 AM UTC', 'Repurpose blog into LinkedIn carousel']
	});
	
	const eventData: StrategyUpdateCompletedData = { suggestions, insights };
	await (emit as any)({ topic: 'strategy.update.completed', data: eventData });
	logger.info('Strategy update completed', { traceId, topicsCount: suggestions.topics.length });
};


