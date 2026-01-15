{ pkgs, ... }: {
  channel = "stable-24.11"; 

  packages = [
    pkgs.python311
    pkgs.nodejs_20
    pkgs.git
    pkgs.gh
    # Build tools for native modules like swisseph
    pkgs.gnumake
    pkgs.gcc
    pkgs.binutils
    pkgs.glibc.dev
    pkgs.stdenv.cc.cc.lib
  ];

  idx.extensions = [
    "rooveterinaryinc.roo-code"
    "google.generative-ai"
  ];

  env = {
    # Correct way to pass linker flags in Nix
    # This tells the linker where to find C libraries like crti.o
    NIX_LDFLAGS = "-L${pkgs.glibc.dev}/lib -L${pkgs.stdenv.cc.cc.lib}/lib";
    # This tells the compiler where to find C headers
    NIX_CFLAGS_COMPILE = "-I${pkgs.glibc.dev}/include";
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