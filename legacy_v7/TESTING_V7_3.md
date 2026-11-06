# V7.3 test deployment / دليل الاختبار

1. Back up your current test deployment, database and media before replacing anything.
2. Upload the project files to a **new development branch**, not main. Do not upload `.env`.
3. Coolify: choose Dockerfile build and internal port 8000; domain v7test.samideveloper.com.
4. Add runtime variables from `.env.example`; use your real secrets in Coolify only.
5. Persist `/app/data` as a volume, otherwise SQLite and media may be lost after redeploy.
6. Deploy only test application; verify `/api/health` returns status ok.
7. Test `/api/ai/chat` via UI, AI Architect, playground, lead form and admin login.
8. Test both language toggle and theme toggle on desktop/mobile.
9. Do not deploy to samideveloper.com without explicit approval.

Notes: This is a test candidate, not a verified production release. Translation in V7.3 covers navigation and primary controls; some page content and admin UI remain Arabic. Theme overrides are initial and require visual QA. The lab is a simulation. Knowledge records do not automatically sync to Qdrant. The requests webhook is optional; incoming leads are stored in SQLite.
