from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Required for YouTube iframe/API requests.
        self.send_header(
            "Referrer-Policy",
            "strict-origin-when-cross-origin",
        )

        # Prevent stale HTML/CSS/JS while you are developing locally.
        self.send_header("Cache-Control", "no-store")

        # Allow media playback inside the YouTube iframe.
        self.send_header(
            "Permissions-Policy",
            "autoplay=*, encrypted-media=*",
        )

        super().end_headers()


if __name__ == "__main__":
    port = 8080

    # Bind to all local interfaces.
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)

    print("Serving on:")
    print(f"  http://localhost:{port}   <-- USE THIS URL")
    print(f"  http://127.0.0.1:{port}")
    print()
    print("IMPORTANT:")
    print("Open http://localhost:8080")
    print("Do NOT open index.html using file://")
    print("Press Ctrl+C to stop the server.")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
    finally:
        server.server_close()
