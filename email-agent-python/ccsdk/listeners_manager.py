"""Listeners manager for email events."""
import os
import importlib.util
from pathlib import Path
from typing import Any, Dict, List, Optional
from agent.types import Email, ListenerContext, ListenerConfig, ListenerResult
from ccsdk.agent_tools import AgentTools


class ListenersManager:
    """Manager for email event listeners."""

    def __init__(self, db_manager, imap_manager, ui_state_manager):
        self.db_manager = db_manager
        self.imap_manager = imap_manager
        self.ui_state_manager = ui_state_manager
        self.listeners: Dict[str, Any] = {}
        self.agent_tools = AgentTools()

    async def load_all_listeners(self):
        """Load all listener modules."""
        listeners_dir = Path(__file__).parent.parent / "agent" / "custom_scripts" / "listeners"

        if not listeners_dir.exists():
            print(f"⚠️  Listeners directory not found: {listeners_dir}")
            return

        for file_path in listeners_dir.glob("*.py"):
            if file_path.name.startswith("_"):
                continue

            await self._load_listener(file_path)

        print(f"✅ Loaded {len(self.listeners)} listener(s)")

    async def _load_listener(self, file_path: Path):
        """Load a single listener module."""
        try:
            spec = importlib.util.spec_from_file_location(file_path.stem, file_path)
            if not spec or not spec.loader:
                return

            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            if not hasattr(module, "config") or not hasattr(module, "handler"):
                print(f"⚠️  Listener {file_path.name} missing config or handler")
                return

            config = module.config
            handler = module.handler

            # Store listener
            self.listeners[config["id"]] = {
                "config": config,
                "handler": handler,
                "file_path": file_path,
            }

            print(f"📝 Loaded listener: {config['name']}")

        except Exception as e:
            print(f"❌ Error loading listener {file_path.name}: {e}")

    async def check_event(self, event: str, email: Email):
        """Check if any listeners should respond to this event."""
        for listener_id, listener in self.listeners.items():
            config = listener["config"]

            if not config.get("enabled", True):
                continue

            if config.get("event") != event:
                continue

            try:
                # Create context
                context = ListenerContext(
                    self.db_manager,
                    self.imap_manager,
                    self.ui_state_manager,
                    self._create_call_agent_fn()
                )

                # Call handler
                result = await listener["handler"](email, context)

                if result.get("executed"):
                    print(f"✅ Listener {config['name']}: {result.get('reason')}")

            except Exception as e:
                print(f"❌ Error executing listener {config['name']}: {e}")

    def _create_call_agent_fn(self):
        """Create a call_agent function for context."""
        async def call_agent(options):
            return await self.agent_tools.call_agent(
                prompt=options["prompt"],
                schema=options["schema"],
                model=options.get("model", "haiku")
            )
        return call_agent

    def get_all_listeners(self) -> List[Dict[str, Any]]:
        """Get all loaded listeners."""
        return [
            {
                "id": listener["config"]["id"],
                "name": listener["config"]["name"],
                "description": listener["config"]["description"],
                "enabled": listener["config"].get("enabled", True),
                "event": listener["config"].get("event"),
            }
            for listener in self.listeners.values()
        ]
