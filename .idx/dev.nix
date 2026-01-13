{ pkgs, ... }: {
  channel = "stable-23.11"; 
  packages = [
    pkgs.nodejs_20
    pkgs.gnumake
    pkgs.gcc
    pkgs.python3
  ];
  idx = {
    extensions = [
      "dbaeumer.vscode-eslint"
    ];
    workspace = {
      onCreate = {
        npm-install = "npm install";
      };
      onStart = {
        run-dev = "npm run dev";
      };
    };
    previews = [
      {
        id = "web";
        name = "Web";
        port = 3000;
        description = "This is the web preview for your project.";
      }
    ];
  };
}
