#!/usr/bin/env bash
# Feedback Bot Development Server Manager
# A polished CLI tool using charmbracelet/gum for managing the dev environment
# Version: 1.0.0

set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────
SCRIPT_VERSION="1.0.0"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOCAL_BIN_DIR="$SCRIPT_DIR/.bin"

# Add local bin directory to PATH if it exists
if [[ -d "$LOCAL_BIN_DIR" ]]; then
    export PATH="$LOCAL_BIN_DIR:$PATH"
fi

# Required environment variables
REQUIRED_ENV_VARS=("PASSWORD_HASH" "SESSION_SECRET" "NANO_GPT_API_KEY")
OPTIONAL_ENV_VARS=("NANO_GPT_MODEL" "API_BASE_URL")

# Available models (parsed from src/config/models.ts)
AVAILABLE_MODELS=(
    "TEE/DeepSeek-v3.2"
    "TEE/gpt-oss-120b"
    "TEE/glm-4.6"
    "TEE/qwen3-coder"
    "TEE/gemma-3-27b-it"
)
DEFAULT_MODEL="TEE/DeepSeek-v3.2"
DEFAULT_API_URL="https://nano-gpt.com/api/v1"

# Build artifacts to clean
BUILD_ARTIFACTS=("node_modules" ".env" "dist" ".astro")

# State
NON_INTERACTIVE=false

# ─────────────────────────────────────────────────────────────────────────────
# Color and Style Utilities
# ─────────────────────────────────────────────────────────────────────────────
# Fallback colors for when gum is not available
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_error() {
    if command -v gum &>/dev/null; then
        gum style --foreground 196 --bold "✗ ERROR: $1"
    else
        echo -e "${RED}✗ ERROR: $1${NC}" >&2
    fi
}

print_success() {
    if command -v gum &>/dev/null; then
        gum style --foreground 82 --bold "✓ $1"
    else
        echo -e "${GREEN}✓ $1${NC}"
    fi
}

print_warning() {
    if command -v gum &>/dev/null; then
        gum style --foreground 214 "⚠ $1"
    else
        echo -e "${YELLOW}⚠ $1${NC}"
    fi
}

print_info() {
    if command -v gum &>/dev/null; then
        gum style --foreground 39 "ℹ $1"
    else
        echo -e "${BLUE}ℹ $1${NC}"
    fi
}

print_header() {
    if command -v gum &>/dev/null; then
        gum style \
            --border double \
            --border-foreground 99 \
            --padding "1 2" \
            --margin "1" \
            --align center \
            --foreground 99 \
            --bold \
            "$1"
    else
        echo ""
        echo "╔════════════════════════════════════════════════════════════╗"
        echo -e "║  ${PURPLE}$1${NC}"
        echo "╚════════════════════════════════════════════════════════════╝"
        echo ""
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Spinner Wrapper
# ─────────────────────────────────────────────────────────────────────────────
run_with_spinner() {
    local title="$1"
    shift

    if command -v gum &>/dev/null && [[ "$NON_INTERACTIVE" == "false" ]]; then
        gum spin --spinner dot --title "$title" -- "$@"
    else
        echo "$title..."
        "$@"
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Help and Version
# ─────────────────────────────────────────────────────────────────────────────
show_help() {
    cat << 'EOF'
Feedback Bot Development Server Manager

Usage: run.sh [OPTIONS] [COMMAND]

Commands:
    start       Start the development server
    build       Build for production
    preview     Preview production build
    setup       Configure environment variables
    clean       Remove build artifacts and dependencies

Options:
    -h, --help              Show this help message
    -v, --version           Show version information
    --no-interactive        Run without interactive prompts (CI mode)

Examples:
    ./run.sh                 Launch interactive menu
    ./run.sh start           Start dev server directly
    ./run.sh setup           Configure environment
    ./run.sh clean           Clean project artifacts
    ./run.sh --no-interactive start
EOF
}

show_version() {
    echo "Feedback Bot Dev Server Manager v${SCRIPT_VERSION}"
}

# ─────────────────────────────────────────────────────────────────────────────
# OS Detection
# ─────────────────────────────────────────────────────────────────────────────
detect_os() {
    local uname_out
    uname_out="$(uname -s 2>/dev/null || echo "Unknown")"

    case "$uname_out" in
        Darwin*)
            echo "macos"
            ;;
        Linux*)
            echo "linux"
            ;;
        CYGWIN*|MINGW*|MSYS*|MINGW32*|MINGW64*)
            echo "windows"
            ;;
        FreeBSD*)
            echo "freebsd"
            ;;
        OpenBSD*)
            echo "openbsd"
            ;;
        NetBSD*)
            echo "netbsd"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

detect_linux_package_manager() {
    if command -v apt-get &>/dev/null; then
        echo "apt"
    elif command -v dnf &>/dev/null; then
        echo "dnf"
    elif command -v yum &>/dev/null; then
        echo "yum"
    elif command -v pacman &>/dev/null; then
        echo "pacman"
    elif command -v zypper &>/dev/null; then
        echo "zypper"
    else
        echo "unknown"
    fi
}

# ─────────────────────────────────────────────────────────────────────────────
# Gum Installation
# ─────────────────────────────────────────────────────────────────────────────
get_gum_install_command() {
    local os="$1"
    local pkg_manager="${2:-}"

    case "$os" in
        macos)
            echo "brew install gum"
            ;;
        linux)
            case "$pkg_manager" in
                apt)
                    # Multi-step install for apt - returns placeholder
                    echo "APT_MULTI_STEP"
                    ;;
                dnf)
                    echo "DNF_MULTI_STEP"
                    ;;
                yum)
                    echo "YUM_MULTI_STEP"
                    ;;
                pacman)
                    echo "sudo pacman -S gum"
                    ;;
                zypper)
                    echo "ZYPPER_MULTI_STEP"
                    ;;
                *)
                    echo ""
                    ;;
            esac
            ;;
        windows)
            echo "winget install charmbracelet.gum"
            ;;
        *)
            echo ""
            ;;
    esac
}

show_gum_install_steps() {
    local os="$1"
    local pkg_manager="${2:-}"

    case "$os" in
        macos)
            echo "  brew install gum"
            ;;
        linux)
            case "$pkg_manager" in
                apt)
                    echo "  sudo mkdir -p /etc/apt/keyrings"
                    echo "  curl -fsSL https://repo.charm.sh/apt/gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/charm.gpg"
                    echo "  echo \"deb [signed-by=/etc/apt/keyrings/charm.gpg] https://repo.charm.sh/apt/ * *\" | sudo tee /etc/apt/sources.list.d/charm.list"
                    echo "  sudo apt update && sudo apt install gum"
                    ;;
                dnf)
                    echo "  echo '[charm]"
                    echo "  name=Charm"
                    echo "  baseurl=https://repo.charm.sh/yum/"
                    echo "  enabled=1"
                    echo "  gpgcheck=1"
                    echo "  gpgkey=https://repo.charm.sh/yum/gpg.key' | sudo tee /etc/yum.repos.d/charm.repo"
                    echo "  sudo rpm --import https://repo.charm.sh/yum/gpg.key"
                    echo "  sudo dnf install gum"
                    ;;
                yum)
                    echo "  echo '[charm]"
                    echo "  name=Charm"
                    echo "  baseurl=https://repo.charm.sh/yum/"
                    echo "  enabled=1"
                    echo "  gpgcheck=1"
                    echo "  gpgkey=https://repo.charm.sh/yum/gpg.key' | sudo tee /etc/yum.repos.d/charm.repo"
                    echo "  sudo rpm --import https://repo.charm.sh/yum/gpg.key"
                    echo "  sudo yum install gum"
                    ;;
                pacman)
                    echo "  sudo pacman -S gum"
                    ;;
                zypper)
                    echo "  echo '[charm]"
                    echo "  name=Charm"
                    echo "  baseurl=https://repo.charm.sh/yum/"
                    echo "  enabled=1"
                    echo "  gpgcheck=1"
                    echo "  gpgkey=https://repo.charm.sh/yum/gpg.key' | sudo tee /etc/yum.repos.d/charm.repo"
                    echo "  sudo rpm --import https://repo.charm.sh/yum/gpg.key"
                    echo "  sudo zypper refresh"
                    echo "  sudo zypper install gum"
                    ;;
                *)
                    echo "  go install github.com/charmbracelet/gum@latest"
                    ;;
            esac
            ;;
        windows)
            echo "  winget install charmbracelet.gum"
            echo "  # or: scoop install charm-gum"
            ;;
        *)
            echo "  go install github.com/charmbracelet/gum@latest"
            ;;
    esac
}

# ─────────────────────────────────────────────────────────────────────────────
# Portable Binary Installation
# ─────────────────────────────────────────────────────────────────────────────

# Check if the OS supports portable binaries
supports_portable_binary() {
    local os="$1"
    case "$os" in
        linux|macos|windows|freebsd|openbsd|netbsd)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# Map uname -m output to GitHub release architecture names
detect_arch() {
    local machine
    machine="$(uname -m 2>/dev/null || echo "unknown")"

    case "$machine" in
        x86_64|amd64)
            echo "amd64"
            ;;
        aarch64|arm64)
            echo "arm64"
            ;;
        i386|i686)
            echo "386"
            ;;
        armv7l|armv7)
            echo "armv7"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}

# Get the OS name for GitHub releases
get_release_os_name() {
    local os="$1"
    case "$os" in
        macos)
            echo "Darwin"
            ;;
        linux)
            echo "Linux"
            ;;
        windows)
            echo "Windows"
            ;;
        freebsd)
            echo "FreeBSD"
            ;;
        openbsd)
            echo "OpenBSD"
            ;;
        netbsd)
            echo "NetBSD"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Get the latest gum release version from GitHub
get_latest_gum_version() {
    local version
    # Try to get the latest release tag from GitHub API
    version=$(curl -fsSL "https://api.github.com/repos/charmbracelet/gum/releases/latest" 2>/dev/null | grep '"tag_name"' | sed -E 's/.*"tag_name": *"v?([^"]+)".*/\1/' || echo "")
    if [[ -z "$version" ]]; then
        # Fallback to a known stable version
        version="0.17.0"
    fi
    echo "$version"
}

# Download and extract the portable gum binary
install_gum_portable() {
    local os="$1"
    local arch="$2"
    local release_os
    local version
    local archive_ext
    local archive_name
    local download_url
    local temp_dir

    release_os=$(get_release_os_name "$os")
    if [[ -z "$release_os" ]]; then
        echo -e "${RED}✗ Unsupported OS for portable binary: $os${NC}"
        return 1
    fi

    if [[ "$arch" == "unknown" ]]; then
        echo -e "${RED}✗ Unsupported architecture: $(uname -m)${NC}"
        return 1
    fi

    echo "Fetching latest gum release version..."
    version=$(get_latest_gum_version)
    echo "Latest version: v$version"

    # Determine archive extension (Windows uses .zip, others use .tar.gz)
    if [[ "$os" == "windows" ]]; then
        archive_ext="zip"
    else
        archive_ext="tar.gz"
    fi

    # Construct the archive filename
    # Format: gum_{version}_{OS}_{arch}.{ext}
    archive_name="gum_${version}_${release_os}_${arch}.${archive_ext}"
    download_url="https://github.com/charmbracelet/gum/releases/download/v${version}/${archive_name}"

    echo ""
    echo -e "${CYAN}Downloading gum v${version} for ${release_os}/${arch}...${NC}"
    echo "URL: $download_url"
    echo ""

    # Create temp directory and local bin directory
    temp_dir=$(mktemp -d)
    mkdir -p "$LOCAL_BIN_DIR"

    # Download the archive
    if ! curl -fsSL "$download_url" -o "$temp_dir/$archive_name"; then
        echo -e "${RED}✗ Failed to download gum binary.${NC}"
        echo ""
        echo "This could be due to:"
        echo "  • Network issues"
        echo "  • Unsupported OS/architecture combination"
        echo "  • GitHub API rate limiting"
        echo ""
        echo "You can try downloading manually from:"
        echo "  https://github.com/charmbracelet/gum/releases"
        rm -rf "$temp_dir"
        return 1
    fi

    echo "Extracting archive..."

    # Extract based on archive type
    if [[ "$archive_ext" == "zip" ]]; then
        if ! command -v unzip &>/dev/null; then
            echo -e "${RED}✗ 'unzip' is required to extract the archive but is not installed.${NC}"
            rm -rf "$temp_dir"
            return 1
        fi
        if ! unzip -q "$temp_dir/$archive_name" -d "$temp_dir"; then
            echo -e "${RED}✗ Failed to extract archive.${NC}"
            rm -rf "$temp_dir"
            return 1
        fi
    else
        if ! tar -xzf "$temp_dir/$archive_name" -C "$temp_dir"; then
            echo -e "${RED}✗ Failed to extract archive.${NC}"
            rm -rf "$temp_dir"
            return 1
        fi
    fi

    # Find the gum binary in the extracted contents
    local gum_binary=""
    if [[ "$os" == "windows" ]]; then
        gum_binary=$(find "$temp_dir" -name "gum.exe" -type f 2>/dev/null | head -n 1)
    else
        gum_binary=$(find "$temp_dir" -name "gum" -type f -executable 2>/dev/null | head -n 1)
        # If not found as executable, try without -executable flag
        if [[ -z "$gum_binary" ]]; then
            gum_binary=$(find "$temp_dir" -name "gum" -type f 2>/dev/null | head -n 1)
        fi
    fi

    if [[ -z "$gum_binary" ]]; then
        echo -e "${RED}✗ Could not find gum binary in the extracted archive.${NC}"
        rm -rf "$temp_dir"
        return 1
    fi

    # Copy to local bin directory
    if [[ "$os" == "windows" ]]; then
        cp "$gum_binary" "$LOCAL_BIN_DIR/gum.exe"
    else
        cp "$gum_binary" "$LOCAL_BIN_DIR/gum"
        chmod +x "$LOCAL_BIN_DIR/gum"
    fi

    # Cleanup
    rm -rf "$temp_dir"

    # Verify installation
    if [[ -x "$LOCAL_BIN_DIR/gum" ]] || [[ -f "$LOCAL_BIN_DIR/gum.exe" ]]; then
        echo ""
        echo -e "${GREEN}✓ gum binary installed to: $LOCAL_BIN_DIR/gum${NC}"
        # Add to PATH for immediate use in this session
        export PATH="$LOCAL_BIN_DIR:$PATH"
        return 0
    else
        echo -e "${RED}✗ Failed to install gum binary.${NC}"
        return 1
    fi
}

install_gum_apt() {
    echo "Setting up Charm apt repository..."
    sudo mkdir -p /etc/apt/keyrings || { echo -e "${RED}Failed to create keyrings directory. Do you have sudo permissions?${NC}"; return 1; }
    curl -fsSL https://repo.charm.sh/apt/gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/charm.gpg || { echo -e "${RED}Failed to download GPG key.${NC}"; return 1; }
    echo "deb [signed-by=/etc/apt/keyrings/charm.gpg] https://repo.charm.sh/apt/ * *" | sudo tee /etc/apt/sources.list.d/charm.list > /dev/null || { echo -e "${RED}Failed to add repository.${NC}"; return 1; }
    echo "Updating package lists..."
    sudo apt update || { echo -e "${RED}Failed to update package lists.${NC}"; return 1; }
    echo "Installing gum..."
    sudo apt install -y gum || { echo -e "${RED}Failed to install gum.${NC}"; return 1; }
    return 0
}

install_gum_dnf_yum() {
    local pkg_cmd="$1"
    echo "Setting up Charm yum repository..."
    echo '[charm]
name=Charm
baseurl=https://repo.charm.sh/yum/
enabled=1
gpgcheck=1
gpgkey=https://repo.charm.sh/yum/gpg.key' | sudo tee /etc/yum.repos.d/charm.repo > /dev/null || { echo -e "${RED}Failed to add repository.${NC}"; return 1; }
    sudo rpm --import https://repo.charm.sh/yum/gpg.key || { echo -e "${RED}Failed to import GPG key.${NC}"; return 1; }
    echo "Installing gum..."
    sudo "$pkg_cmd" install -y gum || { echo -e "${RED}Failed to install gum.${NC}"; return 1; }
    return 0
}

install_gum_zypper() {
    echo "Setting up Charm zypper repository..."
    echo '[charm]
name=Charm
baseurl=https://repo.charm.sh/yum/
enabled=1
gpgcheck=1
gpgkey=https://repo.charm.sh/yum/gpg.key' | sudo tee /etc/yum.repos.d/charm.repo > /dev/null || { echo -e "${RED}Failed to add repository.${NC}"; return 1; }
    sudo rpm --import https://repo.charm.sh/yum/gpg.key || { echo -e "${RED}Failed to import GPG key.${NC}"; return 1; }
    echo "Refreshing repositories..."
    sudo zypper refresh || { echo -e "${RED}Failed to refresh repositories.${NC}"; return 1; }
    echo "Installing gum..."
    sudo zypper install -y gum || { echo -e "${RED}Failed to install gum.${NC}"; return 1; }
    return 0
}

install_gum() {
    local os="$1"
    local pkg_manager="${2:-}"
    local install_cmd

    install_cmd=$(get_gum_install_command "$os" "$pkg_manager")

    case "$install_cmd" in
        APT_MULTI_STEP)
            install_gum_apt
            return $?
            ;;
        DNF_MULTI_STEP)
            install_gum_dnf_yum "dnf"
            return $?
            ;;
        YUM_MULTI_STEP)
            install_gum_dnf_yum "yum"
            return $?
            ;;
        ZYPPER_MULTI_STEP)
            install_gum_zypper
            return $?
            ;;
        "")
            echo -e "${RED}No installation method available for this system.${NC}"
            return 1
            ;;
        *)
            echo "Running: $install_cmd"
            if eval "$install_cmd"; then
                return 0
            else
                echo -e "${RED}Installation command failed.${NC}"
                return 1
            fi
            ;;
    esac
}

prompt_user_confirmation() {
    local prompt="$1"
    local response

    echo -n "$prompt [y/N]: "
    read -r response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# ─────────────────────────────────────────────────────────────────────────────
# Dependency Checks
# ─────────────────────────────────────────────────────────────────────────────
check_gum() {
    # Check if gum is already installed (including local binary)
    if command -v gum &>/dev/null; then
        return 0
    fi

    # Also check explicitly in local bin directory
    if [[ -x "$LOCAL_BIN_DIR/gum" ]]; then
        export PATH="$LOCAL_BIN_DIR:$PATH"
        return 0
    fi

    echo -e "${YELLOW}⚠ 'gum' is not installed.${NC}"
    echo ""
    echo "Gum is a tool for glamorous shell scripts and is required for the"
    echo "interactive features of this script."
    echo ""

    # Detect OS and architecture
    local os arch
    os=$(detect_os)
    arch=$(detect_arch)

    local pkg_manager=""
    if [[ "$os" == "linux" ]]; then
        pkg_manager=$(detect_linux_package_manager)
    fi

    # Show detected environment
    echo -e "${CYAN}Detected environment:${NC}"
    case "$os" in
        macos)
            echo "  • Operating System: macOS"
            ;;
        linux)
            echo "  • Operating System: Linux"
            if [[ "$pkg_manager" != "unknown" ]]; then
                echo "  • Package Manager: $pkg_manager"
            else
                echo "  • Package Manager: Not detected"
            fi
            ;;
        windows)
            echo "  • Operating System: Windows (WSL/Git Bash/MSYS)"
            ;;
        freebsd)
            echo "  • Operating System: FreeBSD"
            ;;
        openbsd)
            echo "  • Operating System: OpenBSD"
            ;;
        netbsd)
            echo "  • Operating System: NetBSD"
            ;;
        *)
            echo "  • Operating System: Unknown"
            ;;
    esac
    echo "  • Architecture: $arch"
    echo ""

    # Check for non-interactive mode
    if [[ "$NON_INTERACTIVE" == "true" ]]; then
        echo -e "${RED}✗ Cannot install gum in non-interactive mode.${NC}"
        echo ""
        echo "Please install gum manually first, or run in interactive mode."
        return 1
    fi

    # Check what installation options are available
    local install_cmd
    install_cmd=$(get_gum_install_command "$os" "$pkg_manager")
    local can_system_install=false
    local can_portable_install=false

    # Check if system install is available
    if [[ -n "$install_cmd" ]]; then
        # Additional checks for system install
        if [[ "$os" == "macos" ]] && ! command -v brew &>/dev/null; then
            can_system_install=false
        elif [[ "$os" == "windows" ]] && ! command -v winget &>/dev/null && ! command -v scoop &>/dev/null; then
            can_system_install=false
        else
            can_system_install=true
        fi
    fi

    # Check if portable binary is available
    if supports_portable_binary "$os" && [[ "$arch" != "unknown" ]]; then
        can_portable_install=true
    fi

    # If neither option is available, show manual instructions
    if [[ "$can_system_install" == "false" ]] && [[ "$can_portable_install" == "false" ]]; then
        echo -e "${RED}✗ Automatic installation is not supported on this system.${NC}"
        echo ""
        echo "Please install gum manually using one of these methods:"
        echo ""
        echo "  From source (requires Go):"
        echo "    go install github.com/charmbracelet/gum@latest"
        echo ""
        echo "  Download binaries from:"
        echo "    https://github.com/charmbracelet/gum/releases"
        echo ""
        echo "See: https://github.com/charmbracelet/gum#installation"
        echo ""
        return 1
    fi

    # Present installation options
    echo -e "${CYAN}Choose an installation method:${NC}"
    echo ""

    local options=()
    local option_descriptions=()

    if [[ "$can_system_install" == "true" ]]; then
        options+=("system")
        echo "  [A] System Install (Recommended)"
        echo "      Install gum permanently using your system's package manager."
        echo "      • Available system-wide for all scripts and terminals"
        echo "      • Updated via package manager"
        echo "      • May require sudo/admin privileges"
        echo ""
    fi

    if [[ "$can_portable_install" == "true" ]]; then
        options+=("portable")
        echo "  [B] Portable Binary"
        echo "      Download a standalone gum binary to: $LOCAL_BIN_DIR/"
        echo "      • Used only by this script (not system-wide)"
        echo "      • No sudo/admin required"
        echo "      • Self-contained, easy to remove"
        echo ""
    fi

    options+=("cancel")
    echo "  [C] Cancel"
    echo "      Skip installation and exit."
    echo ""

    # Prompt for choice
    local choice
    while true; do
        echo -n "Enter your choice [A/B/C]: "
        read -r choice
        choice=$(echo "$choice" | tr '[:lower:]' '[:upper:]')

        case "$choice" in
            A)
                if [[ "$can_system_install" == "true" ]]; then
                    break
                else
                    echo "System install is not available on this system."
                fi
                ;;
            B)
                if [[ "$can_portable_install" == "true" ]]; then
                    break
                else
                    echo "Portable binary is not available for this OS/architecture."
                fi
                ;;
            C)
                echo ""
                echo -e "${YELLOW}Installation cancelled.${NC}"
                echo ""
                echo "You can install gum manually later."
                echo "See: https://github.com/charmbracelet/gum#installation"
                return 1
                ;;
            *)
                echo "Invalid choice. Please enter A, B, or C."
                ;;
        esac
    done

    echo ""

    # Perform the chosen installation
    if [[ "$choice" == "A" ]]; then
        # System installation
        echo -e "${CYAN}Performing system installation...${NC}"
        echo ""
        echo "The following command(s) will be run:"
        echo ""
        show_gum_install_steps "$os" "$pkg_manager"
        echo ""

        # Handle Windows scoop fallback
        if [[ "$os" == "windows" ]] && ! command -v winget &>/dev/null; then
            if command -v scoop &>/dev/null; then
                install_cmd="scoop install charm-gum"
                echo "Using scoop: $install_cmd"
                echo ""
            fi
        fi

        if install_gum "$os" "$pkg_manager"; then
            echo ""
            if command -v gum &>/dev/null; then
                echo -e "${GREEN}✓ gum installed successfully!${NC}"
                return 0
            else
                echo -e "${YELLOW}⚠ Installation completed but gum is not in PATH.${NC}"
                echo ""
                echo "You may need to:"
                echo "  1. Restart your terminal"
                echo "  2. Add the installation directory to your PATH"
                echo ""
                return 1
            fi
        else
            echo ""
            echo -e "${RED}✗ System installation failed.${NC}"
            echo ""
            if [[ "$can_portable_install" == "true" ]]; then
                echo "Would you like to try the portable binary instead?"
                if prompt_user_confirmation "Try portable binary?"; then
                    choice="B"
                else
                    echo ""
                    echo "Please try installing manually:"
                    echo ""
                    show_gum_install_steps "$os" "$pkg_manager"
                    echo ""
                    echo "See: https://github.com/charmbracelet/gum#installation"
                    return 1
                fi
            else
                echo "Please try installing manually:"
                echo ""
                show_gum_install_steps "$os" "$pkg_manager"
                echo ""
                echo "See: https://github.com/charmbracelet/gum#installation"
                return 1
            fi
        fi
    fi

    if [[ "$choice" == "B" ]]; then
        # Portable binary installation
        echo -e "${CYAN}Performing portable binary installation...${NC}"
        echo ""

        if install_gum_portable "$os" "$arch"; then
            echo ""
            if command -v gum &>/dev/null; then
                echo -e "${GREEN}✓ gum portable binary installed successfully!${NC}"
                echo ""
                echo "The binary is located at: $LOCAL_BIN_DIR/gum"
                echo "It will be automatically used when running this script."
                return 0
            else
                echo -e "${RED}✗ Portable binary installed but not working.${NC}"
                return 1
            fi
        else
            echo ""
            echo -e "${RED}✗ Portable binary installation failed.${NC}"
            echo ""
            echo "Please try installing manually from:"
            echo "  https://github.com/charmbracelet/gum/releases"
            echo ""
            echo "See: https://github.com/charmbracelet/gum#installation"
            return 1
        fi
    fi

    return 1
}

check_bun() {
    if ! command -v bun &>/dev/null; then
        print_warning "'bun' is not installed."

        if [[ "$NON_INTERACTIVE" == "true" ]]; then
            print_error "Cannot install bun in non-interactive mode."
            echo "Install manually: curl -fsSL https://bun.sh/install | bash"
            return 1
        fi

        if gum confirm "Would you like to install bun?"; then
            print_info "Installing bun..."
            if curl -fsSL https://bun.sh/install | bash; then
                print_success "Bun installed successfully!"
                # Source the updated PATH
                export BUN_INSTALL="$HOME/.bun"
                export PATH="$BUN_INSTALL/bin:$PATH"
            else
                print_error "Failed to install bun."
                return 1
            fi
        else
            print_error "bun is required to continue."
            return 1
        fi
    fi
    return 0
}

check_node_modules() {
    if [[ ! -d "$PROJECT_ROOT/node_modules" ]]; then
        print_warning "node_modules/ not found."

        if [[ "$NON_INTERACTIVE" == "true" ]]; then
            print_info "Running bun install..."
            cd "$PROJECT_ROOT" && bun install
            return $?
        fi

        if gum confirm "Would you like to run 'bun install'?"; then
            cd "$PROJECT_ROOT"
            run_with_spinner "Installing dependencies" bun install
            print_success "Dependencies installed!"
        else
            print_warning "Some features may not work without dependencies."
        fi
    fi
    return 0
}

check_all_dependencies() {
    print_info "Checking dependencies..."

    check_gum || return 1
    check_bun || return 1
    check_node_modules || return 1

    print_success "All dependencies satisfied!"
    return 0
}


# ─────────────────────────────────────────────────────────────────────────────
# Environment Configuration
# ─────────────────────────────────────────────────────────────────────────────
check_env_var() {
    local var_name="$1"
    local env_file="$PROJECT_ROOT/.env"

    if [[ ! -f "$env_file" ]]; then
        return 1
    fi

    # Check if variable exists and has a non-empty value
    if grep -q "^${var_name}=" "$env_file" 2>/dev/null; then
        local value
        value=$(grep "^${var_name}=" "$env_file" | cut -d'=' -f2-)
        [[ -n "$value" ]]
        return $?
    fi
    return 1
}

check_env_complete() {
    local missing=()

    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if ! check_env_var "$var"; then
            missing+=("$var")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        return 1
    fi
    return 0
}

generate_session_secret() {
    # Generate a random 32-character base64 string
    if command -v openssl &>/dev/null; then
        openssl rand -base64 32
    else
        head -c 32 /dev/urandom | base64
    fi
}

hash_password() {
    local password="$1"
    # Generate SHA-256 hash
    echo -n "$password" | shasum -a 256 | cut -d' ' -f1
}

setup_env_wizard() {
    print_header "Environment Setup Wizard"

    local env_file="$PROJECT_ROOT/.env"
    local temp_env=""

    # Check if .env exists
    if [[ -f "$env_file" ]]; then
        if gum confirm "A .env file already exists. Would you like to reconfigure it?"; then
            # Load existing values as defaults
            source "$env_file" 2>/dev/null || true
        else
            print_info "Keeping existing configuration."
            return 0
        fi
    fi

    print_info "Let's configure your environment variables..."
    echo ""

    # PASSWORD_HASH
    gum style --foreground 39 --bold "1. Password Hash"
    gum style --foreground 245 "   Used for session authentication"
    echo ""

    local password_choice
    password_choice=$(gum choose "Enter a password to hash" "Enter pre-hashed value")

    local password_hash=""
    if [[ "$password_choice" == "Enter a password to hash" ]]; then
        local password
        password=$(gum input --password --placeholder "Enter your password...")
        if [[ -n "$password" ]]; then
            password_hash=$(hash_password "$password")
            print_success "Password hashed successfully!"
        fi
    else
        password_hash=$(gum input --placeholder "Enter SHA-256 hash...")
    fi

    if [[ -z "$password_hash" ]]; then
        print_error "PASSWORD_HASH is required."
        return 1
    fi
    temp_env+="PASSWORD_HASH=${password_hash}\n"
    echo ""

    # SESSION_SECRET
    gum style --foreground 39 --bold "2. Session Secret"
    gum style --foreground 245 "   Used for signing session cookies (32+ characters)"
    echo ""

    local secret_choice
    secret_choice=$(gum choose "Generate automatically" "Enter manually")

    local session_secret=""
    if [[ "$secret_choice" == "Generate automatically" ]]; then
        session_secret=$(generate_session_secret)
        print_success "Session secret generated!"
    else
        session_secret=$(gum input --password --placeholder "Enter session secret (32+ chars)...")
    fi

    if [[ -z "$session_secret" ]]; then
        print_error "SESSION_SECRET is required."
        return 1
    fi
    temp_env+="SESSION_SECRET=${session_secret}\n"
    echo ""

    # NANO_GPT_API_KEY
    gum style --foreground 39 --bold "3. NanoGPT API Key"
    gum style --foreground 245 "   Get your key from https://nano-gpt.com"
    echo ""

    local api_key
    api_key=$(gum input --password --placeholder "Enter your NanoGPT API key (ng_...)...")

    if [[ -z "$api_key" ]]; then
        print_error "NANO_GPT_API_KEY is required."
        return 1
    fi
    temp_env+="NANO_GPT_API_KEY=${api_key}\n"
    echo ""

    # NANO_GPT_MODEL (optional)
    gum style --foreground 39 --bold "4. AI Model (optional)"
    gum style --foreground 245 "   Select the default AI model to use"
    echo ""

    local model
    model=$(gum choose --header "Select a model:" "${AVAILABLE_MODELS[@]}")
    temp_env+="NANO_GPT_MODEL=${model:-$DEFAULT_MODEL}\n"
    print_success "Model set to: ${model:-$DEFAULT_MODEL}"
    echo ""

    # API_BASE_URL (optional)
    gum style --foreground 39 --bold "5. API Base URL (optional)"
    gum style --foreground 245 "   Default: $DEFAULT_API_URL"
    echo ""

    if gum confirm "Use default API URL?"; then
        temp_env+="API_BASE_URL=${DEFAULT_API_URL}\n"
    else
        local custom_url
        custom_url=$(gum input --placeholder "Enter custom API URL...")
        temp_env+="API_BASE_URL=${custom_url:-$DEFAULT_API_URL}\n"
    fi
    echo ""

    # Write to .env file
    print_info "Saving configuration..."
    echo -e "$temp_env" > "$env_file"

    print_success "Environment configured successfully!"
    print_info "Configuration saved to: $env_file"
    return 0
}

# ─────────────────────────────────────────────────────────────────────────────
# Server Management
# ─────────────────────────────────────────────────────────────────────────────
cmd_start() {
    print_header "Starting Development Server"

    cd "$PROJECT_ROOT"

    # Check environment
    if ! check_env_complete; then
        print_warning "Environment is not fully configured."
        if [[ "$NON_INTERACTIVE" == "true" ]]; then
            print_error "Please run setup first."
            return 1
        fi
        if gum confirm "Would you like to run the setup wizard?"; then
            setup_env_wizard || return 1
        else
            print_warning "Continuing without complete environment..."
        fi
    fi

    print_info "Starting Astro development server..."
    echo ""

    # Run the dev server directly (not in background)
    exec bun run dev
}

cmd_build() {
    print_header "Building for Production"

    cd "$PROJECT_ROOT"

    # Check environment
    if ! check_env_complete; then
        print_error "Environment is not configured. Run 'setup' first."
        return 1
    fi

    print_info "Building production bundle..."
    echo ""

    if bun run build; then
        print_success "Build completed successfully!"
        print_info "Output: $PROJECT_ROOT/dist/"
    else
        print_error "Build failed."
        return 1
    fi
}

cmd_preview() {
    print_header "Preview Production Build"

    cd "$PROJECT_ROOT"

    if [[ ! -d "$PROJECT_ROOT/dist" ]]; then
        print_warning "No production build found."
        if [[ "$NON_INTERACTIVE" == "true" ]]; then
            print_error "Please run build first."
            return 1
        fi
        if gum confirm "Would you like to build first?"; then
            cmd_build || return 1
        else
            print_error "Cannot preview without a build."
            return 1
        fi
    fi

    print_info "Starting preview server..."
    echo ""

    exec bun run preview
}


# ─────────────────────────────────────────────────────────────────────────────
# Clean/Wipe Function
# ─────────────────────────────────────────────────────────────────────────────
cmd_clean() {
    print_header "Clean Project"

    cd "$PROJECT_ROOT"

    # List what will be removed
    local to_remove=()
    local size_info=""

    for artifact in "${BUILD_ARTIFACTS[@]}"; do
        local path="$PROJECT_ROOT/$artifact"
        if [[ -e "$path" ]]; then
            to_remove+=("$artifact")
            if [[ -d "$path" ]]; then
                local size
                size=$(du -sh "$path" 2>/dev/null | cut -f1)
                size_info+="  • $artifact ($size)\n"
            else
                size_info+="  • $artifact\n"
            fi
        fi
    done

    if [[ ${#to_remove[@]} -eq 0 ]]; then
        print_info "Nothing to clean!"
        return 0
    fi

    echo ""
    gum style --foreground 214 --bold "The following will be removed:"
    echo -e "$size_info"

    if [[ "$NON_INTERACTIVE" == "true" ]]; then
        print_info "Running in non-interactive mode, proceeding with clean..."
    else
        if ! gum confirm --affirmative "Yes, delete" --negative "Cancel" "Are you sure you want to delete these items?"; then
            print_info "Clean cancelled."
            return 0
        fi
    fi

    echo ""
    for artifact in "${to_remove[@]}"; do
        local path="$PROJECT_ROOT/$artifact"
        if command -v gum &>/dev/null && [[ "$NON_INTERACTIVE" == "false" ]]; then
            gum spin --spinner dot --title "Removing $artifact..." -- rm -rf "$path"
        else
            echo "Removing $artifact..."
            rm -rf "$path"
        fi
        print_success "Removed $artifact"
    done

    echo ""
    print_success "Clean complete!"

    # Offer to reinstall
    if [[ "$NON_INTERACTIVE" == "false" ]]; then
        echo ""
        if gum confirm "Would you like to reinstall dependencies?"; then
            run_with_spinner "Installing dependencies" bun install
            print_success "Dependencies reinstalled!"
        fi
    fi

    # Check for local gum binary and offer to remove it (interactive mode only)
    if [[ "$NON_INTERACTIVE" == "false" ]]; then
        local local_gum_path="$LOCAL_BIN_DIR/gum"
        if [[ -x "$local_gum_path" ]]; then
            echo ""
            gum style --foreground 214 --bold "Local gum binary detected:"
            echo "  • $local_gum_path"
            echo ""
            gum style --foreground 245 --italic \
                "Note: Removing this means gum will need to be reinstalled" \
                "(via system package manager or portable binary)" \
                "the next time the script runs in interactive mode."
            echo ""
            if gum confirm --affirmative "Yes, remove" --negative "Keep it" "Would you also like to remove the portable gum binary?"; then
                rm -rf "$LOCAL_BIN_DIR"
                print_success "Removed local gum binary directory: $LOCAL_BIN_DIR"
            else
                print_info "Local gum binary kept."
            fi
        fi
    fi

    return 0
}

# ─────────────────────────────────────────────────────────────────────────────
# Interactive Menu
# ─────────────────────────────────────────────────────────────────────────────
show_menu() {
    while true; do
        print_header "Feedback Bot Dev Server"

        local choice
        choice=$(gum choose \
            "🚀 Start Development Server" \
            "🔧 Setup Environment" \
            "📦 Build for Production" \
            "👁️  Preview Production Build" \
            "🧹 Clean Project" \
            "❓ Help" \
            "👋 Exit")

        case "$choice" in
            "🚀 Start Development Server")
                cmd_start
                ;;
            "🔧 Setup Environment")
                setup_env_wizard
                ;;
            "📦 Build for Production")
                cmd_build
                echo ""
                gum confirm "Press Enter to continue..." || true
                ;;
            "👁️  Preview Production Build")
                cmd_preview
                ;;
            "🧹 Clean Project")
                cmd_clean
                echo ""
                gum confirm "Press Enter to continue..." || true
                ;;
            "❓ Help")
                show_help
                echo ""
                gum confirm "Press Enter to continue..." || true
                ;;
            "👋 Exit")
                print_info "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid choice"
                ;;
        esac
    done
}


# ─────────────────────────────────────────────────────────────────────────────
# Main Entry Point
# ─────────────────────────────────────────────────────────────────────────────
main() {
    # Parse command line arguments
    local command=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--version)
                show_version
                exit 0
                ;;
            --no-interactive)
                NON_INTERACTIVE=true
                shift
                ;;
            start|build|preview|setup|clean)
                command="$1"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Run '$(basename "$0") --help' for usage."
                exit 1
                ;;
        esac
    done

    # Check gum first (required for interactive mode)
    if [[ "$NON_INTERACTIVE" == "false" ]]; then
        if ! check_gum; then
            exit 1
        fi
    fi

    # Check dependencies
    check_bun || exit 1
    check_node_modules || exit 1

    # Execute command or show menu
    case "$command" in
        start)
            cmd_start
            ;;
        build)
            cmd_build
            ;;
        preview)
            cmd_preview
            ;;
        setup)
            if [[ "$NON_INTERACTIVE" == "true" ]]; then
                print_error "Setup requires interactive mode."
                exit 1
            fi
            setup_env_wizard
            ;;
        clean)
            cmd_clean
            ;;
        "")
            if [[ "$NON_INTERACTIVE" == "true" ]]; then
                print_error "No command specified. Use --help for available commands."
                exit 1
            fi
            show_menu
            ;;
    esac
}

# Run main function
main "$@"