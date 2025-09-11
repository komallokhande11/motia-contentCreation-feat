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


async def _openai_complete(prompt: str, model: str = "gpt-4o-mini") -> str:
	api_key = os.environ.get("OPENAI_API_KEY")
	if not api_key:
		return ""
	url = "https://api.openai.com/v1/chat/completions"
	headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
	payload = {
		"model": model,
		"messages": [{"role": "user", "content": prompt}],
		"temperature": 0.7
	}
	async with aiohttp.ClientSession() as session:
		async with session.post(url, headers=headers, data=json.dumps(payload), timeout=60) as resp:
			data = await resp.json()
			return data.get("choices", [{}])[0].get("message", {}).get("content", "")


def _prompt(platform: str, topic: str, audience: Dict[str, Any], insights: List[str]) -> str:
	persona = audience.get("persona", "general audience")
	language = audience.get("language", "en")
	level = audience.get("readingLevel", "intermediate")
	guidance = {
		"blog": "Write a detailed, well-structured blog post with headings, examples, and references.",
		"linkedin": "Write a professional LinkedIn post with a strong hook and insights.",
		"newsletter": "Write a concise newsletter section with key takeaways.",
		"twitter": "Write a tweet thread of concise, engaging tweets."
	}.get(platform, "Write informative content.")
	return (
		f"Platform: {platform}\nAudience Persona: {persona}\nLanguage: {language}\nLevel: {level}\n"
		f"Topic: {topic}\nInsights:\n- " + "\n- ".join(insights[:8]) + "\n"
		f"Instructions: {guidance}"
	)


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
		# Long-form prompts incorporating full research text when available
		if p == "blog":
			section_guide = (
				"Write a 900-1200 word blog post with: Title, Introduction, 4-6 H2 sections with actionable details, "
				"Examples, and a Conclusion with 3 takeaways. Cite facts from the research when possible."
			)
		elif p == "linkedin":
			section_guide = (
				"Write a LinkedIn post (900-1300 characters) with a strong hook, 3-5 bullet insights, and a CTA."
			)
		elif p == "newsletter":
			section_guide = (
				"Write a newsletter section (350-600 words) with a summary paragraph, 3 bullets, and next steps."
			)
		elif p == "twitter":
			section_guide = (
				"Write a concise tweet thread of 6-8 tweets. Each tweet should be 200-260 characters and standalone."
			)
		else:
			section_guide = "Write informative content."

		prompt = (
			f"You are a senior content strategist.\n"
			f"Topic: {topic}\nAudience: {json.dumps(audience)}\n"
			f"Guidance: {section_guide}\n"
			f"Key Insights:\n- " + "\n- ".join(insights[:8]) + "\n\n"
			f"Research Excerpts (use to ground facts):\n{full_text[:4000]}\n"
		)
		text = await _openai_complete(prompt)
		if not text:
			# Local fallback: compose real content from insights without external APIs
			if insights:
				if p in ("blog", "newsletter", "linkedin"):
					paragraphs = [f"{topic}: Long-form Draft"]
					for i, ins in enumerate(insights[:6], start=1):
						paragraphs.append(f"{i}. {ins}")
					if full_text:
						paragraphs.append("Context: " + full_text[:800])
					paragraphs.append("Implications: Consider audience, distribution channels, and measurement.")
					text = "\n\n".join(paragraphs)
				elif p == "twitter":
					text = "; ".join(insights[:6])
				else:
					text = " ".join(insights[:4])
			else:
				text = f"{topic}: No insights available."
		if p == "twitter":
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


