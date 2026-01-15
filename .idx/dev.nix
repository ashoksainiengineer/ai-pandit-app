{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.11"; 

  # System packages to install (essential for agent runtimes)
  packages = [
    pkgs.python311
    pkgs.nodejs_20
    pkgs.git
    pkgs.gh # GitHub CLI for agent repository management
  ];

  # VS Code Extensions for AI Agents
  idx.extensions = [
    "rooveterinaryinc.roo-code" # The popular Roo Code agent
    "google.generative-ai"      # Official Gemini extension
  ];

  # Environment variables (e.g., for API keys)
  env = {
    # GEMINI_API_KEY = "your_key_here"; # Better to set in terminal or secrets
  };

  # Commands to run when the workspace is created
  idx.workspace.onCreate = {
    install-dependencies = "npm install && pip install aider-chat";
  };
}