#!/usr/bin/env python3
"""
OAuth2テストクライアント用の簡易HTTPサーバー
ポート8081でtest-oauth2-client.htmlを配信し、コールバックを処理します
"""

import http.server
import socketserver
import urllib.parse
import os

class OAuth2TestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # パスを解析
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path == '/':
            # ルートパスの場合、test-oauth2-client.htmlを配信
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            
            with open('test-oauth2-client.html', 'r', encoding='utf-8') as f:
                self.wfile.write(f.read().encode('utf-8'))
                
        elif parsed_path.path == '/callback':
            # OAuth2コールバック
            query_params = urllib.parse.parse_qs(parsed_path.query)
            
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            
            # リダイレクトしてメインページでパラメータを処理
            redirect_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>OAuth2 コールバック</title>
                <meta charset="UTF-8">
            </head>
            <body>
                <p>認証結果を処理中...</p>
                <script>
                    // メインページにリダイレクトしてパラメータを保持
                    window.location.href = '/{parsed_path.query}';
                </script>
            </body>
            </html>
            """
            self.wfile.write(redirect_html.encode('utf-8'))
        else:
            # その他のパス
            super().do_GET()

if __name__ == "__main__":
    PORT = 8081
    
    print(f"🚀 OAuth2テストクライアントサーバーを起動中...")
    print(f"📍 URL: http://localhost:{PORT}")
    print(f"🔧 Ctrl+C で停止")
    
    with socketserver.TCPServer(("", PORT), OAuth2TestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 サーバーを停止しました")