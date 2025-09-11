import type { NoopConfig } from 'motia';

export const config: NoopConfig = {
	type: 'noop',
	name: 'manual-review',
	description: 'Human-in-the-loop review and approval UI',
	virtualSubscribes: ['content.qa.completed'],
	virtualEmits: ['content.approved', { topic: 'content.revisions.requested' }, { topic: 'content.rejected' }],
	flows: ['content-creation-pipeline']
};


