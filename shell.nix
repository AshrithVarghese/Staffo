{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    (pkgs.python3.withPackages (ps: with ps; [
      pandas
      openpyxl
      python-dotenv
      supabase
      pip
    ]))
  ];

  shellHook = ''
    echo "🐍 Python environment loaded for Supabase Excel import!"
  '';
}
