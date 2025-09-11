from typing import Any, Dict, List
import os
import asyncio
try:
	from duckduckgo_search import DDGS  # type: ignore
except Exception:
	DDGS = None  # type: ignore
try:
	import requests  # type: ignore
except Exception:
	requests = None  # type: ignore
try:
	from bs4 import BeautifulSoup  # type: ignore
except Exception:
	BeautifulSoup = None  # type: ignore
import html as htmlmod

config: Dict[str, Any] = {
	"type": "event",
	"name": "topic-research",
	"subscribes": ["content.request.received"],
	"emits": ["content.research.completed"],
	"flows": ["content-creation-pipeline"],
}


def _search_urls(query: str, limit: int = 5) -> List[str]:
	if DDGS is None:
		return []
	with DDGS() as ddgs:  # type: ignore
		results = list(ddgs.text(query, max_results=limit))
	return [r.get("href") or r.get("url") for r in results if isinstance(r, dict)]


def _clean_text(raw: str) -> str:
	# Unescape entities and collapse whitespace
	t = htmlmod.unescape(raw)
	t = " ".join(t.split())
	return t


def _fetch_text(url: str) -> str:
	if not requests or not BeautifulSoup:
		return ""
	try:
		resp = requests.get(url, timeout=12)
		resp.raise_for_status()
		soup = BeautifulSoup(resp.text, "html.parser")
		for s in soup(["script", "style", "noscript"]):
			s.extract()
		text = " ".join(soup.get_text(separator=" ").split())
		return _clean_text(text)[:12000]
	except Exception:
		return ""



async def handler(input_data: Dict[str, Any], ctx: Any) -> None:
	topic = input_data.get("topic", "")
	audience = input_data.get("audience", {})
	target = input_data.get("targetPlatforms", [])
	source_url = input_data.get("sourceUrl")

	# Try live research; gracefully degrade to static if libs not installed
	sources: List[str] = []
	texts: List[str] = []
	if source_url and requests and BeautifulSoup:
		sources = [source_url]
		text = _fetch_text(source_url)
		if text:
			texts.append(text)
	elif DDGS and requests and BeautifulSoup and topic:
		sources = _search_urls(f"{topic} site:wikipedia.org OR site:medium.com OR site:nytimes.com", limit=5)[:5]
		for u in sources:
			if not u:
				continue
			text = _fetch_text(u)
			if text:
				texts.append(text)

	if not texts:
		texts = [
			f"Background overview about {topic}.",
			f"Recent developments related to {topic}.",
			f"Key considerations and best practices for {topic}.",
		]
		sources = ["local:fallback"]

	# If topic is empty, try to infer from first text chunk (page title approximation)
	if not topic and texts:
		first = texts[0].strip()
		if first:
			# take first 10 words as a naive title
			parts = first.split()
			topic = " ".join(parts[:10])

	# Simple heuristic insights (can be replaced with model summarization)
	insights: List[str] = []
	for t in texts[:5]:
		# split into sentences and pick informative snippets
		sentences = [s.strip() for s in t.replace("?", ".").split(".") if len(s.strip()) > 40]
		if sentences:
			insights.extend(sentences[:3])
		else:
			insights.append((t[:220] + "…") if len(t) > 220 else t)
	insights = insights[:8]
	full_text = "\n".join(texts)[:20000]

	research_payload = {"topic": topic, "insights": insights, "sources": sources, "fullText": full_text}
	ctx.logger.info("topic-research prepared research payload", {"payload": {"topic": topic, "sources": sources, "insightCount": len(insights)}})
	await ctx.state.set(ctx.trace_id, "research", research_payload)
	await ctx.emit({
		"topic": "content.research.completed",
		"data": {"topic": topic, "research": research_payload, "audience": audience, "targetPlatforms": target},
	})
	ctx.logger.info("topic-research emitted content.research.completed")


