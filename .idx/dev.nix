{ pkgs, ... }: {
  channel = "stable-24.11"; 

  packages = [
    pkgs.python311
    pkgs.nodejs_20
    pkgs.git
    pkgs.gh
    # Astrology project (swisseph) ke liye ye zaruri hain
    pkgs.gnumake
    pkgs.gcc
    pkgs.stdenv.cc.cc.lib # Extension stability ke liye
  ];

  idx.extensions = [
    "rooveterinaryinc.roo-code"
    "google.generative-ai"
  ];

  # Environment variables
  env = {
    # Nix environment mein path fix karne ke liye
    LD_LIBRARY_PATH = "${pkgs.stdenv.cc.cc.lib}/lib";
  };

  idx.workspace = {
    onCreate = {
      # Dependencies install karna
      install-dependencies = "npm install && pip install aider-chat";
    };
    onStart = {
      # Har baar start hone par agar koi process ruk gayi ho toh use check karna
      check-npm = "npm install";
    };
  };
}