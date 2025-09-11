import { type CronConfig, type CronHandler } from 'motia';

export const config: CronConfig = {
	type: 'cron',
	name: 'strategy-optimizer',
	description: 'Daily analysis to generate content strategy updates',
	cron: '0 7 * * *',
	emits: ['strategy.update.completed'],
	flows: ['content-creation-pipeline']
};

export const handler: CronHandler = async ({ emit, logger, state, traceId }) => {
	// pull aggregated performance insights if present
	const insights = await state.get(traceId, 'performance.insights');
	const suggestions = {
		topics: ['AI policy updates', 'LLM evaluation best practices'],
		recommendations: ['Post threads at 9 AM UTC', 'Repurpose blog into LinkedIn carousel']
	};
	await emit({ topic: 'strategy.update.completed', data: { suggestions, insights } });
	logger.info('Strategy update completed');
};


