import React, { useMemo } from 'react';
import { EventNode, type EventNodeProps } from 'motia/workbench';

export default function ManualReviewNode({ data }: EventNodeProps) {
	const qaSummary = useMemo(() => {
		const r = (data as any)?.payload?.results;
		if (!r) return 'QA results will appear here';
		const entries = Object.entries(r as Record<string, any>);
		const failures = entries.filter(([_, v]) => !v.factCheck.passed || v.plagiarism > 0.2 || v.brandCompliance.passed === false);
		return failures.length ? `${failures.length} item(s) need attention` : 'All checks passed';
	}, [data]);

	return (
		<EventNode data={data} variant="white" shape="rounded" className="p-3 border-2 border-purple-500">
			<div className="text-sm font-semibold">Manual Review</div>
			<div className="text-xs opacity-80">{qaSummary}</div>
			<div className="mt-2 flex gap-2 text-xs">
				<button className="px-2 py-1 bg-green-600 text-white rounded">Approve</button>
				<button className="px-2 py-1 bg-yellow-600 text-white rounded">Request Revisions</button>
				<button className="px-2 py-1 bg-red-600 text-white rounded">Reject</button>
			</div>
		</EventNode>
	);
}


