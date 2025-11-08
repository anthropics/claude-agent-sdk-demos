"""Agent tools for calling Claude API."""
import os
from typing import Any, Dict, Optional
from anthropic import Anthropic


class AgentTools:
    """Tools for calling Claude API."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self.client = Anthropic(api_key=self.api_key)

    async def call_agent(self, prompt: str, schema: Dict[str, Any], model: str = "haiku") -> Any:
        """Call Claude API with structured output."""
        model_map = {
            "opus": "claude-opus-4-20250514",
            "sonnet": "claude-sonnet-4-20250514",
            "haiku": "claude-3-5-haiku-20241022"
        }

        model_id = model_map.get(model, model_map["haiku"])

        response = self.client.messages.create(
            model=model_id,
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            tools=[
                {
                    "name": "respond",
                    "description": "Respond with structured data matching the schema",
                    "input_schema": schema
                }
            ],
            tool_choice={"type": "tool", "name": "respond"}
        )

        # Extract structured response from tool use
        for block in response.content:
            if block.type == "tool_use":
                return block.input

        raise Exception("Agent did not return structured response")
