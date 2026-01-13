{ pkgs, ... }: {
  channel = "stable-23.11"; 
  packages = [
    pkgs.nodejs_20
    pkgs.gnumake     # Error hatane ke liye zaroori
    pkgs.gcc         # Error hatane ke liye zaroori
    pkgs.python3
  ];
  idx = {
    extensions = [];
    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
      onStart = {
        run-dev = "npm run dev";
      };
    };
  };
}