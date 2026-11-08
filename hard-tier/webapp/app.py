from flask import Flask, request
import requests

app = Flask(__name__)

@app.route("/")
def index():
    return """
    <html><body style="font-family: sans-serif; max-width: 600px; margin: 60px auto;">
    <h2>CorpTech Internal Reporting Tool</h2>
    <p>Generate a report preview by pointing this at any internal data source URL.</p>
    <form action="/preview">
      <input name="url" placeholder="http://..." style="width:100%; padding:8px;">
      <button type="submit" style="margin-top:10px; padding:8px 16px;">Preview</button>
    </form>
    </body></html>
    """

@app.route("/preview")
def preview():
    url = request.args.get("url", "")
    if not url:
        return "Provide a url parameter.", 400
    try:
        resp = requests.get(url, timeout=5)
        return f"<pre>{resp.text}</pre>"
    except Exception as e:
        return f"Error fetching URL: {e}", 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)