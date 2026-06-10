#!/usr/bin/env python3
"""
Dev server for VidEdit.

FFmpeg.wasm multi-threading requires two HTTP headers:
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp

A standard `python -m http.server` does NOT set these, so FFmpeg.wasm
falls back to the slower single-threaded mode. This server fixes that.

Usage:
  cd src/video_editor
  python server.py          # serves on http://localhost:8080
  python server.py 9000     # custom port
"""

import http.server
import os
import socketserver
import sys


class CORSHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):  # noqa: N802
        print(f"  {self.address_string()} {fmt % args}")


def main() -> None:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with socketserver.TCPServer(("", port), CORSHandler) as httpd:
        httpd.allow_reuse_address = True
        print(f"\n🎬 VidEdit — Montage Vidéo YouTube")
        print(f"   Ouvre dans ton navigateur : http://localhost:{port}")
        print(f"   Ctrl+C pour arrêter\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nArrêt du serveur.")


if __name__ == "__main__":
    main()
