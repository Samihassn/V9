import os, sys, tempfile, importlib, io, sqlite3, json
from pathlib import Path

os.environ["DATABASE_PATH"] = str(Path(tempfile.mkdtemp()) / "site.db")
os.environ["ADMIN_TOKEN"] = "test-only-not-production-" + "x" * 40
os.environ["HTTPS_ONLY"] = "false"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import app
import pytest
from fastapi.testclient import TestClient
from PIL import Image


@pytest.fixture
def client():
    app.counts.clear()
    with app.db() as db:
        for table in ("leads", "projects", "articles", "services", "knowledge"):
            db.execute(f"DELETE FROM {table}")
    with TestClient(app.app) as c:
        yield c


def auth(c):
    assert c.post("/api/admin/login", json={"token": app.SECRET}).status_code == 200
    c.headers["X-SAMI-Admin"] = "1"


def project():
    return {
        "title_ar": "مشروع",
        "title_en": "Project",
        "summary_ar": "ملخص المشروع",
        "summary_en": "Project summary",
        "category": "AI",
    }


def lead():
    return {
        "name": "Sami",
        "email": "user@example.com",
        "contact": "email@example.com",
        "service": "Automation",
        "details": "A detailed project description",
        "deadline": "2026-12-01",
    }


def test_auth_csrf_cookie(client):
    assert client.get("/api/admin/leads").status_code == 401
    r = client.post("/api/admin/login", json={"token": app.SECRET})
    assert (
        "HttpOnly" in r.headers["set-cookie"]
        and "SameSite=strict" in r.headers["set-cookie"]
    )
    assert client.post("/api/admin/projects", json=project()).status_code == 403
    client.headers["X-SAMI-Admin"] = "1"
    assert (
        client.post(
            "/api/admin/projects",
            json=project(),
            headers={"Origin": "https://evil.example"},
        ).status_code
        == 403
    )
    assert client.post("/api/admin/logout").status_code == 200
    assert client.get("/api/admin/leads").status_code == 401


def test_bilingual_crud_content(client):
    auth(client)
    ident = client.post("/api/admin/projects", json=project()).json()["id"]
    p = client.get("/api/public").json()["projects"][0]
    assert p["title_en"] == "Project" and p["title"] == "مشروع"
    data = project()
    data["published"] = False
    assert client.put(f"/api/admin/projects/{ident}", json=data).status_code == 200
    assert not client.get("/api/public").json()["projects"]
    assert client.delete(f"/api/admin/projects/{ident}").status_code == 200
    a = {
        "title_en": "Article",
        "summary_en": "Article summary",
        "body_en": "Article body content",
    }
    ident = client.post("/api/admin/articles", json=a).json()["id"]
    assert client.put(f"/api/admin/articles/{ident}", json=a).status_code == 200
    assert client.delete(f"/api/admin/articles/{ident}").status_code == 200
    ident = client.post(
        "/api/admin/services",
        json={"title_en": "Automation", "summary_en": "Automate your workflows"},
    ).json()["id"]
    assert client.get("/api/public").json()["services"][0]["title_en"] == "Automation"
    assert client.delete(f"/api/admin/services/{ident}").status_code == 200
    assert (
        client.put(
            "/api/admin/content/title_en", json={"value": "New hero"}
        ).status_code
        == 200
    )
    assert client.get("/api/public").json()["content"]["title_en"] == "New hero"
    assert (
        client.put(
            "/api/admin/content/github", json={"value": "javascript:bad"}
        ).status_code
        == 422
    )


def test_requests_attachment_privacy_and_notifications(client, monkeypatch):
    async def fail(*args, **kwargs):
        raise RuntimeError("offline")

    monkeypatch.setattr(app, "webhook", fail)
    monkeypatch.setenv("SAMI_N8N_REQUESTS_URL", "https://example.com/hook")
    r = client.post(
        "/api/requests",
        data=lead(),
        files={"attachment": ("brief.pdf", b"%PDF-1.4\nexample", "application/pdf")},
    )
    assert r.status_code == 201
    assert r.json()["reference"].startswith("SAMI-")
    auth(client)
    item = client.get("/api/admin/leads").json()[0]
    assert item["notification_status"] == "failed"
    assert client.get(item["attachment_url"]).status_code == 200
    assert (
        client.patch(
            "/api/admin/leads/" + str(item["id"]), json={"status": "reviewing"}
        ).status_code
        == 200
    )
    client.post("/api/admin/logout")
    assert client.get(item["attachment_url"]).status_code == 401
    assert client.get("/api/public").json().get("leads") is None


def test_request_validation_honeypot(client):
    data = lead()
    data["deadline"] = "2026-99-99"
    assert client.post("/api/requests", json=data).status_code == 422
    data = lead()
    data["email"] = "bad"
    assert client.post("/api/requests", json=data).status_code == 422
    data = lead()
    data["website"] = "bot"
    assert client.post("/api/requests", json=data).status_code == 201
    with app.db() as c:
        assert c.execute("SELECT COUNT(*) FROM leads").fetchone()[0] == 0
    assert (
        client.post(
            "/api/requests",
            data=lead(),
            files={"attachment": ("bad.svg", b"<svg/>", "image/svg+xml")},
        ).status_code
        == 415
    )


def test_upload_reencoded(client):
    auth(client)
    data = io.BytesIO()
    Image.new("RGB", (80, 40), "green").save(data, "PNG")
    r = client.post(
        "/api/admin/upload", files={"file": ("x.png", data.getvalue(), "image/png")}
    )
    assert r.status_code == 200 and r.json()["url"].endswith(".webp")
    assert client.get(r.json()["url"]).headers["content-type"] == "image/webp"
    assert (
        client.post(
            "/api/admin/upload", files={"file": ("x.png", b"bad", "image/png")}
        ).status_code
        == 415
    )


def test_ai_contract_and_architect_guard(client, monkeypatch):
    monkeypatch.setenv("SAMI_N8N_WEBHOOK_URL", "https://example.com/webhook")
    monkeypatch.setenv("SAMI_N8N_API_KEY", "test-key")
    calls = []

    async def fake(url, key, payload, timeout):
        calls.append(payload)
        return {"reply": "Hello"}

    monkeypatch.setattr(app, "webhook", fake)
    assert (
        client.post("/api/ai/chat", json={"message": "Hi", "sessionId": "id"}).json()[
            "reply"
        ]
        == "Hello"
    )
    assert calls[0] == {"message": "Hi", "sessionId": "id"}
    sections = {k: ["A technical step"] for k in app.ARCHITECT_KEYS}

    async def structured(*args, **kwargs):
        return {"output": json.dumps(sections)}

    monkeypatch.setattr(app, "webhook", structured)
    assert (
        client.post(
            "/api/ai/architect", json={"message": "Build a workflow", "language": "en"}
        ).json()["sections"]
        == sections
    )
    sections["summary"] = "Cost is 100 USD"
    assert (
        client.post(
            "/api/ai/architect", json={"message": "Build a workflow"}
        ).status_code
        == 502
    )
    monkeypatch.delenv("SAMI_N8N_API_KEY")
    assert client.post("/api/ai/chat", json={"message": "Hi"}).status_code == 503


def test_rate_limit_headers(client):
    for _ in range(5):
        assert client.post("/api/admin/login", json={"token": "bad"}).status_code == 401
    assert client.post("/api/admin/login", json={"token": "bad"}).status_code == 429
    r = client.get("/api/health")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert "frame-ancestors" in r.headers["content-security-policy"]


def test_legacy_database_migration(tmp_path):
    import subprocess

    path = tmp_path / "legacy.db"
    with sqlite3.connect(path) as c:
        c.execute(
            'CREATE TABLE projects (id INTEGER PRIMARY KEY, title_ar TEXT NOT NULL, title_en TEXT NOT NULL, description_ar TEXT NOT NULL, description_en TEXT NOT NULL, category TEXT NOT NULL, image TEXT NOT NULL DEFAULT "", link TEXT NOT NULL DEFAULT "", featured INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP)'
        )
        c.execute(
            'INSERT INTO projects(title_ar,title_en,description_ar,description_en,category) VALUES ("قديم","Existing","وصف قديم","Existing description","AI")'
        )
    code = "import app; from fastapi.testclient import TestClient; c=TestClient(app.app); assert c.get('/api/public').json()['projects'][0]['summary_en']=='Existing description'; c.post('/api/admin/login',json={'token':app.SECRET}); assert c.post('/api/admin/projects',headers={'X-SAMI-Admin':'1'},json={'title_en':'Another','summary_en':'Another project'}).status_code==200"
    env = dict(os.environ, DATABASE_PATH=str(path))
    subprocess.run([sys.executable, "-c", code], env=env, check=True)
    with sqlite3.connect(path) as c:
        assert c.execute("SELECT COUNT(*) FROM projects").fetchone()[0] == 2


def test_financial_guard_word_boundaries():
    assert not app.FINANCIAL.search("احتمالية نجاح المشروع")
    for text in (
        "التكلفة 100",
        "دفع 10 دولار",
        "$100",
        "100 EUR",
        "financial estimate",
    ):
        assert app.FINANCIAL.search(text)


def test_v7_database_preserved_and_empty_database_unseeded(tmp_path):
    import subprocess

    path = tmp_path / "old.db"
    with sqlite3.connect(path) as c:
        c.execute(
            'CREATE TABLE projects (id INTEGER PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, summary TEXT NOT NULL, details TEXT NOT NULL DEFAULT "", image TEXT NOT NULL DEFAULT "", published INTEGER DEFAULT 1, created TEXT DEFAULT CURRENT_TIMESTAMP)'
        )
        c.execute(
            'INSERT INTO projects(title,category,summary) VALUES ("Old project","AI","Existing summary")'
        )
    env = dict(os.environ, DATABASE_PATH=str(path))
    subprocess.run(
        [
            sys.executable,
            "-c",
            "import app; assert app.public()['projects'][0]['summary_ar']=='Existing summary'",
        ],
        env=env,
        check=True,
    )
    env["DATABASE_PATH"] = str(tmp_path / "empty.db")
    subprocess.run(
        [sys.executable, "-c", "import app; assert app.public()['projects']==[]"],
        env=env,
        check=True,
    )


def test_secure_cookie_and_invalid_sessions(client, monkeypatch):
    import time

    monkeypatch.setenv("HTTPS_ONLY", "true")
    response = client.post("/api/admin/login", json={"token": app.SECRET})
    assert "; Secure" in response.headers["set-cookie"]
    client.cookies.clear()
    # Correct signature does not bypass expiry; a future expiry does not bypass signing.
    expired = f"{int(time.time())-1}:nonce"
    for token in (
        expired + "." + app.signature(expired),
        str(int(time.time()) + 3600) + ":nonce.forged",
        "malformed",
    ):
        client.cookies.set("sami_session", token)
        assert client.get("/api/admin/overview").status_code == 401
        client.cookies.clear()


def test_real_webhook_transport_and_error_contract(client, monkeypatch):
    import httpx

    monkeypatch.setenv("SAMI_N8N_WEBHOOK_URL", "https://n8n.example/webhook")
    monkeypatch.setenv("SAMI_N8N_API_KEY", "transport-test-secret")
    real_async_client = httpx.AsyncClient
    responses = [
        httpx.Response(200, json={"reply": "Transport response"}),
        httpx.Response(500, text="private upstream diagnostics"),
        httpx.Response(200, text="not json"),
        httpx.Response(200, json={"unexpected": "shape"}),
        httpx.Response(200, json={"reply": "Not a structured object"}),
    ]
    seen = []

    def handle(request):
        seen.append(request)
        return responses.pop(0)

    def transport_client(**kwargs):
        assert kwargs["follow_redirects"] is False and kwargs["trust_env"] is False
        return real_async_client(transport=httpx.MockTransport(handle), **kwargs)

    monkeypatch.setattr(app.httpx, "AsyncClient", transport_client)
    r = client.post(
        "/api/ai/chat", json={"message": "Hello", "sessionId": "session-123"}
    )
    assert r.json() == {"reply": "Transport response"}
    assert seen[0].method == "POST"
    assert seen[0].headers["X-SAMI-AI-KEY"] == "transport-test-secret"
    assert json.loads(seen[0].content) == {
        "message": "Hello",
        "sessionId": "session-123",
    }
    for _ in range(3):
        r = client.post("/api/ai/chat", json={"message": "Hello"})
        assert r.status_code == 502
        assert (
            "private upstream" not in r.text and "transport-test-secret" not in r.text
        )
    assert (
        client.post(
            "/api/ai/architect", json={"message": "Build an automated workflow"}
        ).status_code
        == 502
    )


def test_settings_messages_migration_restart_idempotence(tmp_path):
    import subprocess

    path = tmp_path / "migration.db"
    with sqlite3.connect(path) as c:
        c.execute("CREATE TABLE settings (key TEXT PRIMARY KEY,value TEXT NOT NULL)")
        c.executemany(
            "INSERT INTO settings VALUES (?,?)",
            [
                ("hero_ar", "عنوان محفوظ"),
                ("hero_en", "Preserved hero"),
                ("intro_en", "Preserved introduction"),
            ],
        )
        c.execute("CREATE TABLE content (key TEXT PRIMARY KEY,value TEXT NOT NULL)")
        c.execute("INSERT INTO content VALUES (?,?)", ("about", "وصف محفوظ"))
        c.execute(
            "CREATE TABLE messages (id INTEGER PRIMARY KEY,name TEXT,email TEXT,message TEXT,created_at TEXT)"
        )
        c.execute(
            'INSERT INTO messages VALUES (7,"Original client","client@example.com","Original client request","2026-10-01 12:00:00")'
        )
    env = dict(os.environ, DATABASE_PATH=str(path))
    check = """import app
p=app.public()
assert p['content']['title_ar']=='عنوان محفوظ'
assert p['content']['title_en']=='Preserved hero'
assert p['content']['about_ar']=='وصف محفوظ'
with app.db() as c:
 assert c.execute('SELECT COUNT(*) FROM leads').fetchone()[0]==1
 assert c.execute('SELECT COUNT(*) FROM messages').fetchone()[0]==1
 r=c.execute('SELECT * FROM leads').fetchone()
 assert r['email']=='client@example.com' and r['details']=='Original client request'
 assert r['created']=='2026-10-01 12:00:00'
"""
    subprocess.run([sys.executable, "-c", check], env=env, check=True)
    with sqlite3.connect(path) as c:
        c.execute(
            "UPDATE content SET value=? WHERE key=?", ("Admin edited hero", "title_en")
        )
        c.execute('UPDATE leads SET status="reviewing"')
    check = (
        check.replace("=='Preserved hero'", "=='Admin edited hero'")
        + "\nwith app.db() as c: assert c.execute('SELECT status FROM leads').fetchone()[0]=='reviewing'\n"
    )
    subprocess.run([sys.executable, "-c", check], env=env, check=True)
    subprocess.run([sys.executable, "-c", check], env=env, check=True)


def test_backup_preserves_database_uploads_private_files(tmp_path):
    import subprocess, zipfile

    root = tmp_path / "data"
    root.mkdir()
    with sqlite3.connect(root / "site.db") as c:
        c.execute("PRAGMA journal_mode=WAL")
        c.execute("CREATE TABLE leads (id INTEGER PRIMARY KEY, details TEXT)")
        c.execute('INSERT INTO leads VALUES (1,"Retained request")')
    for folder, name, data in [
        ("uploads", "image.webp", b"image-data"),
        ("attachments", "private.pdf", b"%PDF-private"),
    ]:
        (root / folder).mkdir()
        (root / folder / name).write_bytes(data)
    archive = tmp_path / "backup.zip"
    subprocess.run(
        [
            sys.executable,
            "scripts/backup.py",
            "--data-dir",
            str(root),
            "--output",
            str(archive),
        ],
        check=True,
    )
    with zipfile.ZipFile(archive) as z:
        assert z.read("attachments/private.pdf") == b"%PDF-private"
        assert z.read("uploads/image.webp") == b"image-data"
        restored = tmp_path / "restored.db"
        restored.write_bytes(z.read("site.db"))
    with sqlite3.connect(restored) as c:
        assert c.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
        assert (
            c.execute("SELECT details FROM leads").fetchone()[0] == "Retained request"
        )
    original = archive.read_bytes()
    result = subprocess.run(
        [
            sys.executable,
            "scripts/backup.py",
            "--data-dir",
            str(root),
            "--output",
            str(archive),
        ],
        capture_output=True,
    )
    assert result.returncode != 0 and archive.read_bytes() == original


def test_seo_metadata_safe_and_assets(client, monkeypatch):
    auth(client)
    monkeypatch.setenv("SITE_URL", "https://samideveloper.com")
    title = "SAMI <script>alert(1)</script>"
    assert (
        client.put("/api/admin/content/site_title", json={"value": title}).status_code
        == 200
    )
    assert (
        client.put(
            "/api/admin/content/site_description_ar", json={"value": 'وصف "آمن"'}
        ).status_code
        == 200
    )
    page = client.get("/")
    assert "<title>SAMI &lt;script&gt;" in page.text
    assert "<script>alert(1)</script>" not in page.text
    assert 'rel="canonical" href="https://samideveloper.com/"' in page.text
    assert "وصف &quot;آمن&quot;" in page.text
    assert "<loc>https://samideveloper.com/</loc>" in client.get("/sitemap.xml").text
    assert "sitemap.xml" in client.get("/robots.txt").text
    for name in (
        "main.js",
        "admin.js",
        "style.css",
        "admin.css",
        "preferences.js",
        "fonts.css",
        "fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2",
        "mark.svg",
    ):
        assert client.get("/static/" + name).status_code == 200


def test_v9_server_rendered_seo(client, monkeypatch):
    monkeypatch.setenv("SITE_URL", "https://samideveloper.com")
    auth(client)
    pid = client.post("/api/admin/projects", json={**project(), "details_ar": "## التحدي\n<b>x</b>"}).json()["id"]
    aid = client.post(
        "/api/admin/articles",
        json={"title_ar": "مقال <script>", "summary_ar": "ملخص المقال", "body_ar": "# عنوان\nنص المقال الكامل"},
    ).json()["id"]
    ar = client.get("/").text
    en = client.get("/en/").text
    # Content is in the HTML itself, not only fetched by JavaScript.
    assert "مشروع" in ar and f'href="/projects/{pid}"' in ar and f'href="/articles/{aid}"' in ar
    assert "<script>" not in ar.split("<body>")[1].split('id="public-data"')[0].replace('<script src', '')
    assert 'hreflang="en" href="https://samideveloper.com/en/"' in ar
    assert '<html lang="en" dir="ltr">' in en and 'rel="canonical" href="https://samideveloper.com/en/"' in en
    assert "Workflow automation" in en and "Your ideas." in en
    assert 'application/ld+json' in ar and 'og:image' in ar and 'summary_large_image' in ar
    ld = json.loads(ar.split('<script type="application/ld+json">')[1].split("</script>")[0])
    assert {n["@type"] for n in ld["@graph"]} >= {"WebSite", "Person", "Organization"}
    page = client.get(f"/articles/{aid}")
    assert page.status_code == 200 and "<h1>مقال &lt;script&gt;</h1>" in page.text and "BlogPosting" in page.text
    assert "<h2>عنوان</h2>" in page.text  # body headings never create a second h1
    assert client.get(f"/en/articles/{aid}", follow_redirects=False).status_code == 302
    case = client.get(f"/projects/{pid}").text
    assert "&lt;b&gt;x&lt;/b&gt;" in case and "<b>x</b>" not in case
    assert client.get(f"/en/projects/{pid}").status_code == 200
    missing = client.get("/does-not-exist")
    assert missing.status_code == 404 and 'name="robots" content="noindex"' in missing.text
    assert client.get("/api/does-not-exist").headers["content-type"].startswith("application/json")
    sitemap = client.get("/sitemap.xml").text
    assert f"https://samideveloper.com/projects/{pid}" in sitemap and "https://samideveloper.com/en/" in sitemap
    assert f"/en/articles/{aid}" not in sitemap  # no English copy, no English URL
    assert "Allow: /api/public" in client.get("/robots.txt").text
    for path in ("/favicon.ico", "/manifest.webmanifest", "/static/og-image.png", "/assets/site.css"):
        assert client.get(path).status_code == 200
    assert client.get("/en", follow_redirects=False).headers["location"] == "/en/"
    assert client.get("/admin").headers.get("x-robots-tag", "").startswith("noindex")
