"""Actions manager for user-triggered actions."""
import importlib.util
from pathlib import Path
from typing import Any, Dict, List
from agent.types import ActionContext, ActionTemplate, ActionResult
from ccsdk.agent_tools import AgentTools


class ActionsManager:
    """Manager for user-triggered actions."""

    def __init__(self):
        self.templates: Dict[str, Any] = {}
        self.instances: Dict[str, Any] = {}
        self.agent_tools = AgentTools()

    async def load_all_templates(self):
        """Load all action templates."""
        actions_dir = Path(__file__).parent.parent / "agent" / "custom_scripts" / "actions"

        if not actions_dir.exists():
            print(f"⚠️  Actions directory not found: {actions_dir}")
            return []

        for file_path in actions_dir.glob("*.py"):
            if file_path.name.startswith("_"):
                continue

            await self._load_template(file_path)

        print(f"✅ Loaded {len(self.templates)} action template(s)")
        return list(self.templates.values())

    async def _load_template(self, file_path: Path):
        """Load a single action template."""
        try:
            spec = importlib.util.spec_from_file_location(file_path.stem, file_path)
            if not spec or not spec.loader:
                return

            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            if not hasattr(module, "config") or not hasattr(module, "handler"):
                print(f"⚠️  Action template {file_path.name} missing config or handler")
                return

            config = module.config
            handler = module.handler

            self.templates[config["id"]] = {
                "config": config,
                "handler": handler,
                "file_path": file_path,
            }

            print(f"⚡ Loaded action: {config['name']}")

        except Exception as e:
            print(f"❌ Error loading action template {file_path.name}: {e}")

    async def execute_action(self, instance_id: str, context: ActionContext) -> ActionResult:
        """Execute an action instance."""
        instance = self.instances.get(instance_id)

        if not instance:
            raise Exception(f"Action instance not found: {instance_id}")

        template_id = instance["templateId"]
        template = self.templates.get(template_id)

        if not template:
            raise Exception(f"Action template not found: {template_id}")

        try:
            result = await template["handler"](instance["parameters"], context)
            return result
        except Exception as e:
            return {
                "success": False,
                "message": f"Action execution failed: {str(e)}"
            }

    def get_all_templates(self) -> List[Dict[str, Any]]:
        """Get all action templates."""
        return [
            {
                "id": template["config"]["id"],
                "name": template["config"]["name"],
                "description": template["config"]["description"],
                "icon": template["config"].get("icon", "⚡"),
                "parameterSchema": template["config"]["parameterSchema"],
            }
            for template in self.templates.values()
        ]
