from typing import Any, Dict, List
import os
import json
import aiohttp

config: Dict[str, Any] = {
	"type": "event",
	"name": "ai-content-generator",
	"subscribes": ["content.research.completed"],
	"emits": ["content.generation.completed"],
	"flows": ["content-creation-pipeline"],
}


async def _openai_complete(prompt: str, platform: str = "blog", model: str = "gpt-4o-mini") -> str:
	api_key = os.environ.get("OPENAI_API_KEY")
	if not api_key:
		return ""
	
	# Platform-specific model and parameter optimization
	model_config = {
		"blog": {"model": "gpt-4o-mini", "temperature": 0.7, "max_tokens": 2000},
		"linkedin": {"model": "gpt-4o-mini", "temperature": 0.8, "max_tokens": 800},
		"newsletter": {"model": "gpt-4o-mini", "temperature": 0.6, "max_tokens": 1200},
		"twitter": {"model": "gpt-4o-mini", "temperature": 0.9, "max_tokens": 1000}
	}
	
	config = model_config.get(platform, {"model": model, "temperature": 0.7, "max_tokens": 1500})
	
	url = "https://api.openai.com/v1/chat/completions"
	headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
	payload = {
		"model": config["model"],
		"messages": [
			{"role": "system", "content": "You are an expert content strategist and copywriter with deep knowledge of platform-specific best practices, SEO, and audience engagement."},
			{"role": "user", "content": prompt}
		],
		"temperature": config["temperature"],
		"max_tokens": config["max_tokens"],
		"top_p": 0.9,
		"frequency_penalty": 0.1,
		"presence_penalty": 0.1
	}
	
	try:
		async with aiohttp.ClientSession() as session:
			async with session.post(url, headers=headers, data=json.dumps(payload), timeout=90) as resp:
				if resp.status == 200:
					data = await resp.json()
					return data.get("choices", [{}])[0].get("message", {}).get("content", "")
				else:
					return ""
	except Exception:
		return ""


def _create_advanced_prompt(platform: str, topic: str, audience: Dict[str, Any], insights: List[str], full_text: str) -> str:
	persona = audience.get("persona", "general audience")
	language = audience.get("language", "en")
	level = audience.get("readingLevel", "intermediate")
	
	# Advanced platform-specific prompt templates
	platform_prompts = {
		"blog": f"""You are a senior content strategist and SEO expert creating a comprehensive blog post.

CONTENT STRATEGY:
- Target Audience: {persona} ({level} level, {language} language)
- Primary Goal: Educate and establish thought leadership
- SEO Focus: Long-tail keywords, semantic search optimization
- Engagement: High dwell time, social shares, backlinks

STRUCTURE REQUIREMENTS:
1. Compelling headline (60-70 characters) with power words
2. Meta description (150-160 characters) with clear value proposition
3. Introduction hook (100-150 words) addressing pain points
4. Table of contents with 4-6 H2 sections
5. Each section: 200-300 words with subheadings, examples, data points
6. Conclusion with 3-5 actionable takeaways
7. Call-to-action for engagement

CONTENT GUIDELINES:
- Use data-driven insights and cite sources
- Include relevant examples and case studies
- Write in active voice with conversational tone
- Add internal linking opportunities
- Include relevant statistics and trends
- Address common objections and FAQs
- End with thought-provoking questions for comments

TONE: Professional yet approachable, authoritative but not condescending""",

		"linkedin": f"""You are a LinkedIn content strategist creating high-engagement professional content.

LINKEDIN STRATEGY:
- Target: {persona} professionals ({level} level, {language} language)
- Goal: Drive engagement, build personal brand, generate leads
- Algorithm: Optimize for LinkedIn's feed algorithm
- Format: Professional insights with personal touch

CONTENT STRUCTURE:
1. Hook (first 125 characters visible) - compelling question or bold statement
2. Context paragraph - why this matters now
3. 3-5 key insights with bullet points or numbered lists
4. Personal perspective or experience
5. Call-to-action (question, poll, or resource)
6. Relevant hashtags (3-5 strategic tags)

ENGAGEMENT TACTICS:
- Start with controversial or thought-provoking statements
- Use "you" to directly address the reader
- Include industry-specific terminology
- Share contrarian viewpoints respectfully
- Ask engaging questions that spark discussion
- Use line breaks for mobile readability
- Include emojis sparingly but strategically

TONE: Professional, confident, slightly conversational, industry-expert voice""",

		"newsletter": f"""You are a newsletter content strategist creating valuable subscriber content.

NEWSLETTER STRATEGY:
- Audience: {persona} subscribers ({level} level, {language} language)
- Goal: Provide exclusive value, maintain engagement, drive actions
- Format: Scannable, actionable, exclusive insights
- Frequency: Weekly digest format

CONTENT STRUCTURE:
1. Subject line (50 characters max) - curiosity-driven
2. Preview text (90 characters) - value proposition
3. Opening paragraph - personal note or big news
4. Main content sections:
   - "This Week's Insights" (3-4 key points)
   - "Quick Wins" (actionable tips)
   - "Industry Watch" (trends and updates)
   - "Tool Spotlight" (recommended resources)
5. Closing with next week's preview
6. P.S. with exclusive offer or personal note

NEWSLETTER BEST PRACTICES:
- Use conversational, personal tone
- Include exclusive data or insights
- Make content scannable with headers and bullets
- Add personal anecdotes or behind-the-scenes content
- Include clear CTAs for each section
- Use "I" and "we" to build connection
- End with questions to encourage replies

TONE: Personal, insider, valuable, slightly informal""",

		"twitter": f"""You are a Twitter content strategist creating viral-worthy thread content.

TWITTER STRATEGY:
- Audience: {persona} professionals ({level} level, {language} language)
- Goal: Drive engagement, build following, establish expertise
- Format: Thread of 6-10 tweets with cohesive narrative
- Timing: Optimize for peak engagement hours

THREAD STRUCTURE:
1. Hook tweet - compelling question, bold statement, or "🧵" thread indicator
2. Context tweet - why this matters now
3. 4-6 insight tweets with:
   - One key point per tweet
   - Supporting data or examples
   - Visual elements (emojis, numbers, symbols)
4. Personal take or experience tweet
5. Call-to-action tweet with engagement ask
6. Closing tweet with key takeaway

TWEET OPTIMIZATION:
- 200-260 characters per tweet (optimal engagement)
- Use line breaks for readability
- Include relevant hashtags (1-2 per tweet)
- Add emojis strategically for visual appeal
- Use numbers and statistics for credibility
- Ask questions to encourage replies
- Include "RT if you agree" or similar CTAs
- Use thread numbering (1/8, 2/8, etc.)

TONE: Conversational, punchy, authoritative, slightly provocative"""
	}
	
	base_prompt = platform_prompts.get(platform, "Create engaging, informative content.")
	
	return f"""{base_prompt}

TOPIC: {topic}

RESEARCH INSIGHTS:
{chr(10).join(f"• {insight}" for insight in insights[:8])}

RESEARCH CONTEXT:
{full_text[:3000]}

AUDIENCE DETAILS:
- Persona: {persona}
- Language: {language}
- Reading Level: {level}

INSTRUCTIONS:
1. Create content that resonates with the specific audience persona
2. Use the research insights to add credibility and depth
3. Follow platform-specific best practices for maximum engagement
4. Ensure content is original, valuable, and actionable
5. Optimize for the target platform's algorithm and user behavior
6. Include relevant examples, data points, and actionable takeaways

OUTPUT FORMAT: Return only the final content, no explanations or meta-commentary."""


async def handler(input_data: Dict[str, Any], ctx: Any) -> None:
	research = input_data.get("research") or {}
	topic = research.get("topic") or input_data.get("topic") or ""
	insights: List[str] = research.get("insights", [])
	full_text: str = (research.get("fullText") or "")[:12000]
	audience: Dict[str, Any] = input_data.get("audience", {})
	platforms: List[str] = input_data.get("targetPlatforms", ["blog"]) or ["blog"]

	results: Dict[str, Any] = {}
	drafts: Dict[str, Any] = {}
	
	for p in platforms:
		# Use the advanced platform-specific prompt system
		prompt = _create_advanced_prompt(p, topic, audience, insights, full_text)
		text = await _openai_complete(prompt, p)
		if not text:
			# Enhanced fallback: compose platform-specific content from insights
			if insights:
				if p == "blog":
					text = f"""# {topic}: A Comprehensive Guide

## Introduction
Based on recent research and industry insights, {topic} represents a significant opportunity for {audience.get('persona', 'professionals')} to drive meaningful impact.

## Key Insights
{chr(10).join(f"### {i+1}. {insight}" for i, insight in enumerate(insights[:6]))}

## Strategic Implications
The research suggests several critical considerations for {audience.get('persona', 'organizations')}:
- Market positioning opportunities
- Implementation challenges and solutions
- Long-term strategic value

## Next Steps
1. Assess current capabilities against these insights
2. Develop targeted implementation roadmap
3. Establish success metrics and monitoring

## Conclusion
{topic} offers substantial potential when approached strategically. The key is to start with a clear understanding of your specific context and goals.

---
*This analysis is based on research conducted on {audience.get('language', 'English')} language sources.*"""

				elif p == "linkedin":
					text = f"""🚀 {topic}: Key Insights for {audience.get('persona', 'Professionals')}

After analyzing the latest research, here's what caught my attention:

{chr(10).join(f"• {insight}" for insight in insights[:5])}

💡 My take: This represents a significant shift in how we approach {topic.lower()}. The data suggests we're at an inflection point.

🎯 For {audience.get('persona', 'teams')}: Focus on these areas first:
1. Strategic alignment
2. Capability building  
3. Measurement frameworks

What's your experience with {topic.lower()}? I'd love to hear your thoughts in the comments.

#{topic.replace(' ', '')} #Strategy #Innovation #Leadership"""

				elif p == "newsletter":
					text = f"""Subject: {topic} - This Week's Key Insights

Hi there,

This week I've been diving deep into {topic}, and the research reveals some fascinating trends that I think you'll find valuable.

📊 What I Found:
{chr(10).join(f"• {insight}" for insight in insights[:4])}

🎯 Why This Matters:
The implications for {audience.get('persona', 'our industry')} are significant. We're seeing a clear shift in how successful organizations approach this space.

💡 Quick Win:
Start by assessing your current position against these insights. Most organizations I work with are surprised by the gaps they discover.

🔍 What's Next:
I'll be sharing a detailed implementation framework in next week's issue, including specific tools and tactics you can use immediately.

Until then, keep an eye on how these trends develop in your market.

Best,
[Your Name]

P.S. If you're seeing different patterns in your industry, hit reply and let me know. I'd love to include diverse perspectives in my analysis."""

				elif p == "twitter":
					tweets = []
					tweets.append(f"🧵 {topic}: What the research reveals (thread)")
					tweets.append(f"After analyzing the latest data, here's what caught my attention:")
					for i, insight in enumerate(insights[:4], 1):
						tweets.append(f"{i}/5 {insight[:200]}{'...' if len(insight) > 200 else ''}")
					tweets.append(f"Key takeaway: {topic} is at an inflection point. The data is clear.")
					tweets.append(f"What's your experience? RT if you agree 👇")
					text = tweets
				else:
					text = f"{topic}: " + " ".join(insights[:4])
			else:
				text = f"{topic}: Research insights will be available once the analysis is complete."
		if p == "twitter":
			# Handle both list of tweets and single text
			if isinstance(text, list):
				results[p] = text[:8]
			else:
				# Split long text into tweet-sized chunks
				tweets = [text[i:i+240] for i in range(0, len(text), 240)]
				results[p] = tweets[:8]
		else:
			results[p] = text
		drafts[p] = results[p]

	await ctx.state.set(ctx.trace_id, "generated.content", results)
	await ctx.state.set(ctx.trace_id, "artifacts.drafts", drafts)

	ctx.logger.info("ai-content-generator produced results", {"results": results})
	await ctx.emit({
		"topic": "content.generation.completed",
		"data": {
			"platformContents": {
				"blog": results.get("blog"),
				"twitter": results.get("twitter", []),
				"linkedin": results.get("linkedin"),
				"newsletter": results.get("newsletter"),
			},
			"context": {"topic": topic, "audience": audience},
		},
	})
	ctx.logger.info("ai-content-generator emitted content.generation.completed")


