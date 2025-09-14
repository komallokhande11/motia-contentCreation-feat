import React, { useMemo } from 'react';
import { EventNode, type EventNodeProps } from '@motiadev/workbench';
import { type QAResults } from '../types/shared';

interface QAEventData {
	results?: QAResults;
	platformContents?: {
		blog?: string;
		twitter?: string[];
		linkedin?: string;
		newsletter?: string;
	};
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

export default function ReviewStepUI({ data }: EventNodeProps) {
	const eventData = (data as any) as QAEventData | undefined;
	
	const handleReviewAction = async (action: 'approve' | 'reject' | 'request_changes') => {
		if (!eventData?.traceId) {
			console.error('No trace ID available for review action');
			return;
		}
		
		try {
			const response = await fetch('/api/manual-review', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					traceId: eventData.traceId,
					action,
					reason: `Content ${action}d by human reviewer`
				})
			});
			
			if (response.ok) {
				console.log(`Content ${action}d successfully`);
			} else {
				console.error(`Failed to ${action} content:`, await response.text());
			}
		} catch (error) {
			console.error(`Error ${action}ing content:`, error);
		}
	};
	
	const qaSummary = useMemo(() => {
		const results = eventData?.results;
		
		if (!results) return { status: 'pending', message: 'QA results will appear here' };
		
		const entries = Object.entries(results);
		const failures = entries.filter(([_, result]) => 
			!result.factCheck.passed || result.plagiarism > 0.2 || !result.brandCompliance.passed
		);
		
		return {
			status: failures.length > 0 ? 'issues' : 'passed',
			message: failures.length ? `${failures.length} item(s) need attention` : 'All checks passed',
			failures: failures.length
		};
	}, [eventData?.results]);

	const contentSummary = useMemo(() => {
		const contents = eventData?.platformContents;
		if (!contents) return [];
		
		return Object.entries(contents)
			.filter(([_, content]) => content && (Array.isArray(content) ? content.length > 0 : content.length > 0))
			.map(([platform, content]) => {
				if (platform === 'twitter' && Array.isArray(content)) {
					return `${platform} (${content.length} tweets)`;
				}
				return platform;
			});
	}, [eventData?.platformContents]);

	return (
		<EventNode data={data}>
			<div style={{ 
				padding: '16px', 
				border: '2px solid #8b5cf6', 
				borderRadius: '8px', 
				backgroundColor: '#faf5ff',
				minWidth: '350px',
				maxWidth: '500px'
			}}>
				<h3 style={{ margin: '0 0 12px 0', color: '#7c3aed' }}>📝 Manual Review</h3>
				
				{eventData?.context && (
					<div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
						<p style={{ margin: '4px 0', fontSize: '14px' }}><strong>📋 Topic:</strong> {eventData.context.topic}</p>
						<p style={{ margin: '4px 0', fontSize: '14px' }}><strong>👥 Audience:</strong> {eventData.context.audience.persona}</p>
						<p style={{ margin: '4px 0', fontSize: '14px' }}><strong>🌐 Language:</strong> {eventData.context.audience.language} ({eventData.context.audience.readingLevel})</p>
					</div>
				)}
				
				{contentSummary.length > 0 && (
					<div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#ecfdf5', borderRadius: '4px' }}>
						<p style={{ margin: '4px 0', fontSize: '14px', fontWeight: 'bold' }}>📱 Content Ready:</p>
						<p style={{ margin: '4px 0', fontSize: '14px' }}>{contentSummary.join(', ')}</p>
					</div>
				)}
				
				<div style={{ 
					marginBottom: '12px', 
					padding: '8px', 
					backgroundColor: qaSummary.status === 'passed' ? '#ecfdf5' : qaSummary.status === 'issues' ? '#fef3c7' : '#f3f4f6', 
					borderRadius: '4px' 
				}}>
					<p style={{ margin: '4px 0', fontSize: '14px', fontWeight: 'bold' }}>✅ Quality Check:</p>
					<p style={{ margin: '4px 0', fontSize: '14px' }}>{qaSummary.message}</p>
				</div>
				
				<div style={{ 
					padding: '12px', 
					backgroundColor: '#fef3c7', 
					borderRadius: '6px',
					border: '1px solid #f59e0b'
				}}>
					<p style={{ margin: '0 0 8px 0', color: '#92400e', fontWeight: 'bold' }}>
						 Awaiting Human Review
					</p>
					<p style={{ margin: 0, color: '#92400e', fontSize: '13px' }}>
						Content requires human approval before publishing. Check the Workbench for review options.
					</p>
					<div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
						<button 
							onClick={() => handleReviewAction('approve')}
							style={{ 
								padding: '4px 8px', 
								backgroundColor: '#10b981', 
								color: 'white', 
								border: 'none', 
								borderRadius: '4px',
								fontSize: '12px',
								cursor: 'pointer'
							}}
						>
							✅ Approve
						</button>
						<button 
							onClick={() => handleReviewAction('request_changes')}
							style={{ 
								padding: '4px 8px', 
								backgroundColor: '#f59e0b', 
								color: 'white', 
								border: 'none', 
								borderRadius: '4px',
								fontSize: '12px',
								cursor: 'pointer'
							}}
						>
							✏️ Request Changes
						</button>
						<button 
							onClick={() => handleReviewAction('reject')}
							style={{ 
								padding: '4px 8px', 
								backgroundColor: '#ef4444', 
								color: 'white', 
								border: 'none', 
								borderRadius: '4px',
								fontSize: '12px',
								cursor: 'pointer'
							}}
						>
							❌ Reject
						</button>
					</div>
				</div>
			</div>
		</EventNode>
	);
}


