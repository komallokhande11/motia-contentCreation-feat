import React, { useMemo } from 'react';
import { EventNode, type EventNodeProps } from '@motiadev/workbench';
import { type QAResults } from '../types/shared';

interface QAEventData {
	results?: QAResults;
	context?: {
		topic: string;
		audience: {
			persona: string;
			language: string;
			readingLevel: string;
		};
	};
	traceId: string;
}

export default function ManualReviewNode({ data }: EventNodeProps) {
	const qaSummary = useMemo(() => {
		const eventData = (data as any) as QAEventData | undefined;
		const results = eventData?.results;
		
		if (!results) return 'QA results will appear here';
		
		const entries = Object.entries(results);
		const failures = entries.filter(([_, result]) => 
			!result.factCheck.passed || result.plagiarism > 0.2 || !result.brandCompliance.passed
		);
		
		return failures.length ? `${failures.length} item(s) need attention` : 'All checks passed';
	}, [data]);

	return (
		<EventNode data={data}>
			<div className="p-3 border-2 border-purple-500">
				<div className="text-sm font-semibold">Manual Review</div>
				<div className="text-xs opacity-80">{qaSummary}</div>
				<div className="mt-2 flex gap-2 text-xs">
					<button className="px-2 py-1 bg-green-600 text-white rounded">Approve</button>
					<button className="px-2 py-1 bg-yellow-600 text-white rounded">Request Revisions</button>
					<button className="px-2 py-1 bg-red-600 text-white rounded">Reject</button>
				</div>
			</div>
		</EventNode>
	);
}


