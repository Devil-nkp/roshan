from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

if __name__ == "__main__":
    port = 8080
    print(f"Serving on http://localhost:{port}")
    print("Open that exact address. Do not open index.html with file://")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
