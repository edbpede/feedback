#!/usr/bin/env python3
"""
Astro Development Server Manager

A Textual TUI application for managing the Astro development server,
checking dependencies, configuring environment variables, and performing cleanup.

Usage:
    uv run scripts/devserver.py [OPTIONS]

Options:
    --help, -h      Show this help message
    --check         Run dependency checks only
    --setup         Launch interactive .env setup wizard
    --clean, --wipe Full cleanup mode
    --verbose, -v   Enable verbose output
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import re
import secrets
import shutil
import sys
from asyncio.subprocess import Process
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import ClassVar, Final, Literal, override

from textual import on, work
from textual.app import App, ComposeResult
from textual.binding import Binding, BindingType
from textual.containers import Container, Horizontal, ScrollableContainer, Vertical
from textual.screen import Screen
from textual.widgets import (
    Button,
    Checkbox,
    DataTable,
    Footer,
    Header,
    Input,
    Label,
    Log,
    RadioButton,
    RadioSet,
    Rule,
    Static,
)

# =============================================================================
# Type Aliases
# =============================================================================

type StatusType = Literal["ok", "missing", "error"]
type EnvStatusType = Literal["set", "missing", "default"]
type OutputCallback = Callable[[str], None]


# =============================================================================
# Constants
# =============================================================================

PROJECT_ROOT: Final[Path] = Path(__file__).parent.parent.parent.resolve()
MODELS_TS_PATH: Final[Path] = PROJECT_ROOT / "src" / "config" / "models.ts"
ENV_PATH: Final[Path] = PROJECT_ROOT / ".env"
ENV_EXAMPLE_PATH: Final[Path] = PROJECT_ROOT / ".env.example"

CLEANUP_TARGETS: Final[list[tuple[str, str, bool]]] = [
    ("node_modules", "NPM dependencies", False),
    (".astro", "Astro cache", False),
    ("dist", "Build output", False),
    (".vercel", "Vercel metadata", False),
    (".env", "Environment secrets", True),
]

REQUIRED_ENV_VARS: Final[list[tuple[str, bool, str | None]]] = [
    ("PASSWORD_HASH", True, None),
    ("SESSION_SECRET", True, None),
    ("NANO_GPT_API_KEY", True, None),
    ("NANO_GPT_MODEL", False, "TEE/deepseek-r1"),
    ("API_BASE_URL", False, "https://nano-gpt.com/api/v1"),
]


# =============================================================================
# Data Structures
# =============================================================================


@dataclass(slots=True, frozen=True)
class ModelInfo:
    """Parsed model information from models.ts."""

    id: str
    provider: str
    pricing_tier: str
    speed_tier: str


@dataclass(slots=True)
class DependencyCheck:
    """Result of a dependency check."""

    name: str
    status: StatusType
    message: str
    fix_command: str | None = None


@dataclass(slots=True)
class EnvVarCheck:
    """Result of an environment variable check."""

    name: str
    status: EnvStatusType
    required: bool
    default_value: str | None = None
    current_value: str | None = None


@dataclass(slots=True)
class CleanupTarget:
    """A target for cleanup operations."""

    path: Path
    description: str
    exists: bool
    size_bytes: int = 0
    requires_confirmation: bool = False


@dataclass(slots=True)
class EnvConfig:
    """Complete environment configuration."""

    password_hash: str
    session_secret: str
    nano_gpt_api_key: str
    nano_gpt_model: str = "TEE/deepseek-r1"
    api_base_url: str = "https://nano-gpt.com/api/v1"


@dataclass(slots=True)
class CLIArgs:
    """Typed CLI arguments."""

    check: bool = False
    setup: bool = False
    clean: bool = False
    verbose: bool = False


# =============================================================================
# Exceptions
# =============================================================================


class DevServerError(Exception):
    """Base exception for devserver errors."""


class DependencyError(DevServerError):
    """Raised when a required dependency is missing."""


class ConfigurationError(DevServerError):
    """Raised when configuration is invalid or missing."""


# =============================================================================
# Core Functions - Dependency Checking
# =============================================================================


def check_bun() -> DependencyCheck:
    """Check if bun binary is available in PATH."""
    bun_path = shutil.which("bun")
    if bun_path:
        return DependencyCheck(
            name="bun",
            status="ok",
            message=f"Found at {bun_path}",
        )
    return DependencyCheck(
        name="bun",
        status="missing",
        message="Bun runtime not found in PATH",
        fix_command="curl -fsSL https://bun.sh/install | bash",
    )


def check_node_modules() -> DependencyCheck:
    """Check if node_modules directory exists."""
    node_modules = PROJECT_ROOT / "node_modules"
    if node_modules.is_dir():
        return DependencyCheck(
            name="node_modules",
            status="ok",
            message="Dependencies installed",
        )
    return DependencyCheck(
        name="node_modules",
        status="missing",
        message="Dependencies not installed",
        fix_command="bun install",
    )


def check_all_dependencies() -> list[DependencyCheck]:
    """Check all required dependencies."""
    return [check_bun(), check_node_modules()]


def has_missing_dependencies(checks: Sequence[DependencyCheck]) -> bool:
    """Check if any dependencies are missing."""
    return any(check.status == "missing" for check in checks)


# =============================================================================
# Core Functions - Model Parser
# =============================================================================


def parse_models_ts(models_path: Path = MODELS_TS_PATH) -> list[ModelInfo]:
    """Parse model definitions from src/config/models.ts."""
    if not models_path.exists():
        return []

    content = models_path.read_text()

    # Regex pattern to extract model objects from AVAILABLE_MODELS array
    # Match each object block within the array
    model_pattern = re.compile(
        r'\{\s*'
        + r'id:\s*"([^"]+)"[^}]*?'
        + r'pricingTier:\s*"([^"]+)"[^}]*?'
        + r'provider:\s*"([^"]+)"[^}]*?'
        + r'speedTier:\s*"([^"]+)"',
        re.DOTALL,
    )

    models: list[ModelInfo] = []
    for match in model_pattern.finditer(content):
        models.append(
            ModelInfo(
                id=match.group(1),
                pricing_tier=match.group(2),
                provider=match.group(3),
                speed_tier=match.group(4),
            )
        )

    return models


def get_default_model() -> str:
    """Get the default model ID."""
    models = parse_models_ts()
    if models:
        return models[0].id
    return "TEE/deepseek-r1"


# =============================================================================
# Core Functions - Environment Manager
# =============================================================================


def parse_env_file(env_path: Path = ENV_PATH) -> dict[str, str]:
    """Parse .env file into a dictionary."""
    if not env_path.exists():
        return {}

    env_vars: dict[str, str] = {}
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, _, value = line.partition("=")
            env_vars[key.strip()] = value.strip()

    return env_vars


def check_env_vars() -> list[EnvVarCheck]:
    """Check environment variable status."""
    env_vars = parse_env_file()
    results: list[EnvVarCheck] = []

    for name, required, default in REQUIRED_ENV_VARS:
        value = env_vars.get(name)

        if value:
            # Mask secrets in display
            masked = value[:4] + "..." if len(value) > 8 else "***"
            results.append(
                EnvVarCheck(
                    name=name,
                    status="set",
                    required=required,
                    current_value=masked,
                )
            )
        elif default:
            results.append(
                EnvVarCheck(
                    name=name,
                    status="default",
                    required=required,
                    default_value=default,
                )
            )
        else:
            results.append(
                EnvVarCheck(
                    name=name,
                    status="missing",
                    required=required,
                )
            )

    return results


def has_missing_env_vars(checks: Sequence[EnvVarCheck]) -> bool:
    """Check if any required environment variables are missing."""
    return any(check.status == "missing" and check.required for check in checks)


def generate_password_hash(password: str) -> str:
    """Generate SHA-256 hash of password."""
    return hashlib.sha256(password.encode()).hexdigest()


def generate_session_secret(length: int = 32) -> str:
    """Generate a cryptographically secure session secret."""
    return secrets.token_urlsafe(length)


def write_env_file(config: EnvConfig, env_path: Path = ENV_PATH) -> None:
    """Write environment configuration to .env file."""
    content = f"""# Generated by devserver.py

# SHA-256 hash of the access password
PASSWORD_HASH={config.password_hash}

# Random string for signing session cookies (32+ chars)
SESSION_SECRET={config.session_secret}

# API key from nano-gpt.com
NANO_GPT_API_KEY={config.nano_gpt_api_key}

# Model identifier
NANO_GPT_MODEL={config.nano_gpt_model}

# API base URL
API_BASE_URL={config.api_base_url}
"""
    _ = env_path.write_text(content)


# =============================================================================
# Core Functions - Cleanup
# =============================================================================


def get_directory_size(path: Path) -> int:
    """Calculate total size of a directory in bytes."""
    if not path.exists():
        return 0
    if path.is_file():
        return path.stat().st_size
    return sum(f.stat().st_size for f in path.rglob("*") if f.is_file())


def get_cleanup_targets() -> list[CleanupTarget]:
    """Get all cleanup targets with their sizes."""
    targets: list[CleanupTarget] = []

    for name, description, requires_confirm in CLEANUP_TARGETS:
        path = PROJECT_ROOT / name
        exists = path.exists()
        size = get_directory_size(path) if exists else 0

        targets.append(
            CleanupTarget(
                path=path,
                description=description,
                exists=exists,
                size_bytes=size,
                requires_confirmation=requires_confirm,
            )
        )

    return targets


def format_size(size_bytes: int) -> str:
    """Format size in human-readable form."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    if size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"


async def perform_cleanup(
    targets: Sequence[CleanupTarget],
    on_progress: OutputCallback,
) -> None:
    """Perform cleanup of selected targets."""
    for target in targets:
        if not target.exists:
            continue

        on_progress(f"Removing {target.path.name}...")

        if target.path.is_dir():
            shutil.rmtree(target.path)
        else:
            target.path.unlink()

        on_progress(f"Removed {target.path.name}")

    # Run bun cache clean
    bun_path = shutil.which("bun")
    if bun_path:
        on_progress("Cleaning bun cache...")
        process = await asyncio.create_subprocess_exec(
            "bun",
            "cache",
            "clean",
            cwd=PROJECT_ROOT,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        _ = await process.wait()
        on_progress("Bun cache cleaned")


# =============================================================================
# Server Process Manager
# =============================================================================


class ServerManager:
    """Manages the Astro development server process."""

    _process: Process | None
    _running: bool

    def __init__(self) -> None:
        self._process = None
        self._running = False

    @property
    def is_running(self) -> bool:
        """Check if server is running."""
        return self._running and self._process is not None

    async def start(
        self,
        on_output: OutputCallback,
        on_error: OutputCallback,
    ) -> None:
        """Start the development server."""
        if self._running:
            return

        self._running = True
        self._process = await asyncio.create_subprocess_exec(
            "bun",
            "run",
            "dev",
            cwd=PROJECT_ROOT,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        async with asyncio.TaskGroup() as tg:
            _ = tg.create_task(self._read_stream(self._process.stdout, on_output))
            _ = tg.create_task(self._read_stream(self._process.stderr, on_error))

    async def _read_stream(
        self,
        stream: asyncio.StreamReader | None,
        callback: OutputCallback,
    ) -> None:
        """Read from stream and call callback for each line."""
        if stream is None:
            return

        while self._running:
            try:
                line = await stream.readline()
                if not line:
                    break
                callback(line.decode().rstrip())
            except asyncio.CancelledError:
                break

    async def stop(self) -> None:
        """Stop the development server gracefully."""
        self._running = False
        if self._process:
            self._process.terminate()
            try:
                async with asyncio.timeout(5):
                    _ = await self._process.wait()
            except TimeoutError:
                self._process.kill()
            self._process = None


# =============================================================================
# Textual TUI - Widgets
# =============================================================================


class StatusPanel(Static):
    """Displays dependency and environment status."""

    DEFAULT_CSS: ClassVar[str] = """
    StatusPanel {
        width: 100%;
        height: auto;
        padding: 1;
        border: solid $primary;
        margin-bottom: 1;
    }

    StatusPanel .section-title {
        text-style: bold;
        color: $primary;
        margin-bottom: 1;
    }

    StatusPanel DataTable {
        height: auto;
        max-height: 10;
    }
    """

    @override
    def compose(self) -> ComposeResult:
        yield Label("Dependencies", classes="section-title")
        yield DataTable[str](id="deps-table")
        yield Rule()
        yield Label("Environment Variables", classes="section-title")
        yield DataTable[str](id="env-table")

    def on_mount(self) -> None:
        """Initialize tables."""
        deps_table: DataTable[str] = self.query_one("#deps-table", DataTable)
        _ = deps_table.add_columns("Name", "Status", "Message")

        env_table: DataTable[str] = self.query_one("#env-table", DataTable)
        _ = env_table.add_columns("Variable", "Status", "Value")

        self.refresh_status()

    def refresh_status(self) -> None:
        """Refresh dependency and environment status."""
        deps_table: DataTable[str] = self.query_one("#deps-table", DataTable)
        _ = deps_table.clear()

        for check in check_all_dependencies():
            status_text = "[green]OK[/]" if check.status == "ok" else "[red]MISSING[/]"
            _ = deps_table.add_row(check.name, status_text, check.message)

        env_table: DataTable[str] = self.query_one("#env-table", DataTable)
        _ = env_table.clear()

        for check in check_env_vars():
            if check.status == "set":
                status_text = "[green]SET[/]"
                value = check.current_value or ""
            elif check.status == "default":
                status_text = "[yellow]DEFAULT[/]"
                value = check.default_value or ""
            else:
                status_text = "[red]MISSING[/]"
                value = "Required" if check.required else "Optional"
            _ = env_table.add_row(check.name, status_text, value)


class ServerLogWidget(Log):
    """Real-time server output display."""

    DEFAULT_CSS: ClassVar[str] = """
    ServerLogWidget {
        border: solid $secondary;
        height: 1fr;
        min-height: 10;
    }
    """

    @override
    def __init__(self) -> None:
        super().__init__(highlight=True, auto_scroll=True)


# =============================================================================
# Textual TUI - Setup Wizard Screen
# =============================================================================


class SetupWizardScreen(Screen[EnvConfig | None]):
    """Interactive environment setup wizard."""

    BINDINGS: ClassVar[list[BindingType]] = [
        Binding("escape", "cancel", "Cancel"),
    ]

    DEFAULT_CSS: ClassVar[str] = """
    SetupWizardScreen {
        align: center middle;
    }

    SetupWizardScreen > Container {
        width: 80;
        height: auto;
        max-height: 90%;
        border: solid $primary;
        padding: 1 2;
    }

    SetupWizardScreen .title {
        text-style: bold;
        color: $primary;
        margin-bottom: 1;
    }

    SetupWizardScreen .step-label {
        margin-top: 1;
        margin-bottom: 0;
    }

    SetupWizardScreen Input {
        margin-bottom: 1;
    }

    SetupWizardScreen .hint {
        color: $text-muted;
        margin-bottom: 1;
    }

    SetupWizardScreen .buttons {
        margin-top: 1;
        align: right middle;
    }

    SetupWizardScreen Button {
        margin-left: 1;
    }

    SetupWizardScreen RadioSet {
        height: auto;
        max-height: 15;
        margin-bottom: 1;
    }
    """

    _models: list[ModelInfo]

    @override
    def __init__(self) -> None:
        super().__init__()
        self._models = parse_models_ts()

    @override
    def compose(self) -> ComposeResult:
        with Container():
            yield Label("Environment Setup Wizard", classes="title")
            yield Rule()

            yield Label("Access Password:", classes="step-label")
            yield Input(
                placeholder="Enter your access password",
                password=True,
                id="password-input",
            )
            yield Label(
                "This will be hashed with SHA-256 and stored as PASSWORD_HASH",
                classes="hint",
            )

            yield Label("Session Secret:", classes="step-label")
            with Horizontal():
                yield Input(
                    placeholder="Auto-generated (or enter custom)",
                    id="secret-input",
                )
                yield Button("Generate", id="generate-secret")

            yield Label("NanoGPT API Key:", classes="step-label")
            yield Input(
                placeholder="ng_your_api_key_here",
                password=True,
                id="api-key-input",
            )
            yield Label("Get your API key from nano-gpt.com", classes="hint")

            yield Label("Select Model:", classes="step-label")
            with RadioSet(id="model-select"):
                for model in self._models:
                    label = f"{model.id} ({model.provider}, {model.pricing_tier}, {model.speed_tier})"
                    yield RadioButton(label, value=True if model == self._models[0] else False)

            with Horizontal(classes="buttons"):
                yield Button("Cancel", variant="default", id="cancel-btn")
                yield Button("Save", variant="primary", id="save-btn")

    def on_mount(self) -> None:
        """Initialize with auto-generated secret."""
        secret_input = self.query_one("#secret-input", Input)
        secret_input.value = generate_session_secret()

    @on(Button.Pressed, "#generate-secret")
    def handle_generate_secret(self) -> None:
        """Generate a new session secret."""
        secret_input = self.query_one("#secret-input", Input)
        secret_input.value = generate_session_secret()

    @on(Button.Pressed, "#cancel-btn")
    def handle_cancel(self) -> None:
        """Cancel setup."""
        _ = self.dismiss(None)

    def action_cancel(self) -> None:
        """Handle escape key."""
        _ = self.dismiss(None)

    @on(Button.Pressed, "#save-btn")
    def handle_save(self) -> None:
        """Save configuration."""
        password_input = self.query_one("#password-input", Input)
        secret_input = self.query_one("#secret-input", Input)
        api_key_input = self.query_one("#api-key-input", Input)
        model_select = self.query_one("#model-select", RadioSet)

        # Validate inputs
        if not password_input.value:
            self.notify("Password is required", severity="error")
            return
        if not secret_input.value:
            self.notify("Session secret is required", severity="error")
            return
        if not api_key_input.value:
            self.notify("API key is required", severity="error")
            return

        # Get selected model
        selected_model = "TEE/deepseek-r1"
        if self._models:
            idx = model_select.pressed_index
            if 0 <= idx < len(self._models):
                selected_model = self._models[idx].id

        config = EnvConfig(
            password_hash=generate_password_hash(password_input.value),
            session_secret=secret_input.value,
            nano_gpt_api_key=api_key_input.value,
            nano_gpt_model=selected_model,
        )

        _ = self.dismiss(config)


# =============================================================================
# Textual TUI - Cleanup Screen
# =============================================================================


class CleanupScreen(Screen[list[CleanupTarget] | None]):
    """Cleanup confirmation screen."""

    BINDINGS: ClassVar[list[BindingType]] = [
        Binding("escape", "cancel", "Cancel"),
    ]

    DEFAULT_CSS: ClassVar[str] = """
    CleanupScreen {
        align: center middle;
    }

    CleanupScreen > Container {
        width: 70;
        height: auto;
        max-height: 80%;
        border: solid $warning;
        padding: 1 2;
    }

    CleanupScreen .title {
        text-style: bold;
        color: $warning;
        margin-bottom: 1;
    }

    CleanupScreen .warning {
        color: $error;
        margin-bottom: 1;
    }

    CleanupScreen .target-list {
        height: auto;
        max-height: 20;
        margin-bottom: 1;
    }

    CleanupScreen .target-item {
        height: auto;
        margin-bottom: 0;
    }

    CleanupScreen .buttons {
        margin-top: 1;
        align: right middle;
    }

    CleanupScreen Button {
        margin-left: 1;
    }
    """

    _targets: list[CleanupTarget]

    @override
    def __init__(self) -> None:
        super().__init__()
        self._targets = get_cleanup_targets()

    @override
    def compose(self) -> ComposeResult:
        with Container():
            yield Label("Cleanup / Wipe", classes="title")
            yield Label(
                "Warning: This will permanently delete the selected items!",
                classes="warning",
            )
            yield Rule()

            with ScrollableContainer(classes="target-list"):
                for i, target in enumerate(self._targets):
                    if target.exists:
                        size_str = format_size(target.size_bytes)
                        label = f"{target.path.name} - {target.description} ({size_str})"
                        if target.requires_confirmation:
                            label += " [CONFIRM REQUIRED]"
                        yield Checkbox(
                            label,
                            id=f"target-{i}",
                            value=not target.requires_confirmation,
                            classes="target-item",
                        )

            with Horizontal(classes="buttons"):
                yield Button("Cancel", variant="default", id="cancel-btn")
                yield Button("Delete Selected", variant="error", id="delete-btn")

    @on(Button.Pressed, "#cancel-btn")
    def handle_cancel(self) -> None:
        """Cancel cleanup."""
        _ = self.dismiss(None)

    def action_cancel(self) -> None:
        """Handle escape key."""
        _ = self.dismiss(None)

    @on(Button.Pressed, "#delete-btn")
    def handle_delete(self) -> None:
        """Delete selected targets."""
        selected: list[CleanupTarget] = []

        for i, target in enumerate(self._targets):
            checkbox = self.query_one(f"#target-{i}", Checkbox)
            if checkbox.value and target.exists:
                selected.append(target)

        if not selected:
            self.notify("No items selected", severity="warning")
            return

        _ = self.dismiss(selected)


# =============================================================================
# Textual TUI - Main Screen
# =============================================================================


class MainScreen(Screen[None]):
    """Main dashboard screen."""

    DEFAULT_CSS: ClassVar[str] = """
    MainScreen {
        layout: grid;
        grid-size: 1;
        grid-rows: auto 1fr auto;
    }

    MainScreen .main-content {
        padding: 1;
    }

    MainScreen .action-buttons {
        height: auto;
        padding: 1;
        align: center middle;
    }

    MainScreen .action-buttons Button {
        margin: 0 1;
    }
    """

    @override
    def compose(self) -> ComposeResult:
        yield Header()
        with Vertical(classes="main-content"):
            yield StatusPanel()
            yield Label("Server Output:", id="server-label")
            yield ServerLogWidget()
        with Horizontal(classes="action-buttons"):
            yield Button("Start Server", variant="success", id="start-btn")
            yield Button("Stop Server", variant="error", id="stop-btn", disabled=True)
            yield Button("Refresh", variant="default", id="refresh-btn")
            yield Button("Setup .env", variant="primary", id="setup-btn")
            yield Button("Cleanup", variant="warning", id="cleanup-btn")
        yield Footer()


# =============================================================================
# Textual TUI - Main App
# =============================================================================


class DevServerApp(App[None]):
    """Astro development server manager application."""

    TITLE: str | None = "Astro Dev Server Manager"
    SUB_TITLE: str | None = "Manage your development environment"

    BINDINGS: ClassVar[list[BindingType]] = [
        Binding("q", "quit", "Quit"),
        Binding("s", "start_server", "Start"),
        Binding("x", "stop_server", "Stop"),
        Binding("r", "refresh", "Refresh"),
        Binding("e", "setup_env", "Setup"),
        Binding("w", "cleanup", "Wipe"),
    ]

    CSS: ClassVar[str] = """
    Screen {
        background: $surface;
    }
    """

    _verbose: bool
    _server: ServerManager

    @override
    def __init__(self, verbose: bool = False) -> None:
        super().__init__()
        self._verbose = verbose
        self._server = ServerManager()

    def on_mount(self) -> None:
        """Initialize the app."""
        _ = self.push_screen(MainScreen())

    def _get_log_widget(self) -> ServerLogWidget | None:
        """Get the server log widget if available."""
        try:
            return self.query_one(ServerLogWidget)
        except Exception:
            return None

    def _get_status_panel(self) -> StatusPanel | None:
        """Get the status panel if available."""
        try:
            return self.query_one(StatusPanel)
        except Exception:
            return None

    def _update_button_states(self) -> None:
        """Update button states based on server status."""
        try:
            start_btn = self.query_one("#start-btn", Button)
            stop_btn = self.query_one("#stop-btn", Button)
            start_btn.disabled = self._server.is_running
            stop_btn.disabled = not self._server.is_running
        except Exception:
            pass

    @on(Button.Pressed, "#start-btn")
    def handle_start_button(self) -> None:
        """Handle start button press."""
        self.action_start_server()

    @on(Button.Pressed, "#stop-btn")
    def handle_stop_button(self) -> None:
        """Handle stop button press."""
        self.action_stop_server()

    @on(Button.Pressed, "#refresh-btn")
    def handle_refresh_button(self) -> None:
        """Handle refresh button press."""
        self.action_refresh()

    @on(Button.Pressed, "#setup-btn")
    def handle_setup_button(self) -> None:
        """Handle setup button press."""
        self.action_setup_env()

    @on(Button.Pressed, "#cleanup-btn")
    def handle_cleanup_button(self) -> None:
        """Handle cleanup button press."""
        self.action_cleanup()

    def action_refresh(self) -> None:
        """Refresh status displays."""
        panel = self._get_status_panel()
        if panel:
            panel.refresh_status()
        self.notify("Status refreshed")

    def action_setup_env(self) -> None:
        """Launch setup wizard."""

        def handle_result(config: EnvConfig | None) -> None:
            if config:
                write_env_file(config)
                self.notify("Environment configuration saved!", severity="information")
                panel = self._get_status_panel()
                if panel:
                    panel.refresh_status()

        _ = self.push_screen(SetupWizardScreen(), handle_result)

    def action_cleanup(self) -> None:
        """Launch cleanup screen."""

        def handle_result(targets: list[CleanupTarget] | None) -> None:
            if targets:
                _ = self._perform_cleanup(targets)

        _ = self.push_screen(CleanupScreen(), handle_result)

    @work(exclusive=True)
    async def _perform_cleanup(self, targets: list[CleanupTarget]) -> None:
        """Perform cleanup in background."""
        log_widget = self._get_log_widget()

        def on_progress(msg: str) -> None:
            if log_widget:
                _ = log_widget.write_line(f"[cleanup] {msg}")

        await perform_cleanup(targets, on_progress)
        self.notify("Cleanup completed!", severity="information")
        panel = self._get_status_panel()
        if panel:
            panel.refresh_status()

    def action_start_server(self) -> None:
        """Start the development server."""
        if self._server.is_running:
            self.notify("Server is already running", severity="warning")
            return

        # Check dependencies first
        deps = check_all_dependencies()
        if has_missing_dependencies(deps):
            self.notify(
                "Missing dependencies. Run 'bun install' first.",
                severity="error",
            )
            return

        _ = self._start_server_task()

    @work(exclusive=True)
    async def _start_server_task(self) -> None:
        """Start server in background task."""
        log_widget = self._get_log_widget()

        def on_output(line: str) -> None:
            if log_widget:
                _ = log_widget.write_line(line)

        def on_error(line: str) -> None:
            if log_widget:
                _ = log_widget.write_line(f"[stderr] {line}")

        self._update_button_states()
        self.notify("Starting development server...")

        try:
            await self._server.start(on_output, on_error)
        except Exception as e:
            self.notify(f"Server error: {e}", severity="error")
        finally:
            self._update_button_states()

    def action_stop_server(self) -> None:
        """Stop the development server."""
        if not self._server.is_running:
            self.notify("Server is not running", severity="warning")
            return

        _ = self._stop_server_task()

    @work(exclusive=True)
    async def _stop_server_task(self) -> None:
        """Stop server in background task."""
        await self._server.stop()
        self._update_button_states()
        self.notify("Server stopped")


# =============================================================================
# CLI Functions
# =============================================================================


def run_check_only(verbose: bool = False) -> int:
    """Run dependency checks only and return exit code."""
    print("Checking dependencies...")
    print()

    deps = check_all_dependencies()
    all_ok = True

    for check in deps:
        status = "OK" if check.status == "ok" else "MISSING"
        print(f"  {check.name}: {status}")
        if verbose or check.status != "ok":
            print(f"    {check.message}")
        if check.fix_command and check.status != "ok":
            print(f"    Fix: {check.fix_command}")
            all_ok = False
        print()

    print("Checking environment variables...")
    print()

    env_checks = check_env_vars()
    for check in env_checks:
        if check.status == "set":
            status = "SET"
            value = check.current_value or ""
        elif check.status == "default":
            status = "DEFAULT"
            value = check.default_value or ""
        else:
            status = "MISSING"
            value = "Required" if check.required else "Optional"
            if check.required:
                all_ok = False

        req_str = "(required)" if check.required else "(optional)"
        print(f"  {check.name} {req_str}: {status}")
        if verbose or check.status != "set":
            print(f"    Value: {value}")
        print()

    if all_ok:
        print("All checks passed!")
        return 0
    print("Some checks failed. Run with --setup to configure.")
    return 1


def run_setup_cli() -> int:
    """Run interactive setup in CLI mode (non-TUI fallback)."""
    print("Environment Setup")
    print("=" * 40)
    print()

    # Get password
    password = input("Enter access password: ")
    if not password:
        print("Error: Password is required")
        return 1

    # Generate or get session secret
    secret = generate_session_secret()
    print(f"Generated session secret: {secret[:8]}...")
    use_generated = input("Use this secret? [Y/n]: ").strip().lower()
    if use_generated == "n":
        secret = input("Enter custom session secret: ")
        if not secret:
            print("Error: Session secret is required")
            return 1

    # Get API key
    api_key = input("Enter NanoGPT API key: ")
    if not api_key:
        print("Error: API key is required")
        return 1

    # Select model
    models = parse_models_ts()
    print()
    print("Available models:")
    for i, model in enumerate(models):
        print(f"  {i + 1}. {model.id} ({model.provider})")
    print()

    model_choice = input(f"Select model [1-{len(models)}] (default: 1): ").strip()
    if model_choice:
        try:
            idx = int(model_choice) - 1
            if 0 <= idx < len(models):
                selected_model = models[idx].id
            else:
                selected_model = models[0].id if models else "TEE/deepseek-r1"
        except ValueError:
            selected_model = models[0].id if models else "TEE/deepseek-r1"
    else:
        selected_model = models[0].id if models else "TEE/deepseek-r1"

    # Write config
    config = EnvConfig(
        password_hash=generate_password_hash(password),
        session_secret=secret,
        nano_gpt_api_key=api_key,
        nano_gpt_model=selected_model,
    )

    write_env_file(config)
    print()
    print(f"Configuration saved to {ENV_PATH}")
    return 0


def run_cleanup_cli() -> int:
    """Run cleanup in CLI mode."""
    print("Cleanup / Wipe")
    print("=" * 40)
    print()
    print("Warning: This will permanently delete files!")
    print()

    targets = get_cleanup_targets()
    existing_targets = [t for t in targets if t.exists]

    if not existing_targets:
        print("Nothing to clean up.")
        return 0

    print("Available targets:")
    for i, target in enumerate(existing_targets):
        size_str = format_size(target.size_bytes)
        confirm_str = " [CONFIRM REQUIRED]" if target.requires_confirmation else ""
        print(f"  {i + 1}. {target.path.name} - {target.description} ({size_str}){confirm_str}")
    print()

    selection = input(f"Enter targets to delete (e.g., 1,2,3 or 'all'): ").strip().lower()

    if selection == "all":
        selected_indices = list(range(len(existing_targets)))
    else:
        try:
            selected_indices = [int(x.strip()) - 1 for x in selection.split(",")]
        except ValueError:
            print("Invalid selection")
            return 1

    selected_targets: list[CleanupTarget] = []
    for idx in selected_indices:
        if 0 <= idx < len(existing_targets):
            target = existing_targets[idx]
            if target.requires_confirmation:
                confirm = input(f"Confirm deletion of {target.path.name}? [y/N]: ").strip().lower()
                if confirm != "y":
                    print(f"Skipping {target.path.name}")
                    continue
            selected_targets.append(target)

    if not selected_targets:
        print("No targets selected.")
        return 0

    print()
    print("Deleting selected targets...")

    async def do_cleanup() -> None:
        await perform_cleanup(selected_targets, print)

    asyncio.run(do_cleanup())

    print()
    print("Cleanup completed!")
    return 0


def parse_cli_args() -> CLIArgs:
    """Parse command line arguments into typed structure."""
    parser = argparse.ArgumentParser(
        description="Astro Development Server Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  uv run scripts/devserver.py            Start the TUI
  uv run scripts/devserver.py --check    Check dependencies only
  uv run scripts/devserver.py --setup    Configure environment
  uv run scripts/devserver.py --clean    Clean up build artifacts
        """,
    )
    _ = parser.add_argument(
        "--check",
        action="store_true",
        help="Run dependency checks only (don't start server)",
    )
    _ = parser.add_argument(
        "--setup",
        action="store_true",
        help="Run interactive .env setup wizard",
    )
    _ = parser.add_argument(
        "--clean",
        "--wipe",
        action="store_true",
        dest="clean",
        help="Full cleanup mode (remove node_modules, cache, etc.)",
    )
    _ = parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable verbose output",
    )

    ns = parser.parse_args()
    return CLIArgs(
        check=bool(getattr(ns, "check", False)),
        setup=bool(getattr(ns, "setup", False)),
        clean=bool(getattr(ns, "clean", False)),
        verbose=bool(getattr(ns, "verbose", False)),
    )


def main() -> int:
    """Main entry point."""
    args = parse_cli_args()

    # Handle non-TUI modes
    if args.check:
        return run_check_only(args.verbose)

    if args.setup:
        # Try TUI setup first, fall back to CLI
        try:
            app = DevServerApp(verbose=args.verbose)
            _ = app.push_screen(SetupWizardScreen())
            app.run()
            return 0
        except Exception:
            return run_setup_cli()

    if args.clean:
        # Try TUI cleanup first, fall back to CLI
        try:
            app = DevServerApp(verbose=args.verbose)
            _ = app.push_screen(CleanupScreen())
            app.run()
            return 0
        except Exception:
            return run_cleanup_cli()

    # Default: start TUI
    app = DevServerApp(verbose=args.verbose)
    app.run()
    return 0


if __name__ == "__main__":
    sys.exit(main())
