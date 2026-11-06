"""Server-side rendering and SEO helpers for SAMI DEVELOPER.

Everything a crawler needs (text, links, metadata, structured data) is rendered
on the server, in Arabic at "/" and in English at "/en/". main.js then takes
over the same markup for interactivity. CMS text is always HTML-escaped.
"""

import json
import re
from datetime import date
from html import escape

SITE_NAME = "SAMI DEVELOPER"
PERSON = {"ar": "سامي مقداد", "en": "Sami Meqdad"}
ASSET_VERSION = "9"

DEFAULT_TITLE = {
    "ar": "سامي مقداد | تطوير تطبيقات وأتمتة بالذكاء الاصطناعي — SAMI DEVELOPER",
    "en": "Sami Meqdad | AI Automation & Full-Stack Developer — SAMI DEVELOPER",
}
DEFAULT_DESCRIPTION = {
    "ar": "سامي مقداد مطوّر تطبيقات متكاملة ومتخصص في أتمتة الأعمال بالذكاء الاصطناعي: مسارات عمل n8n، مساعدون أذكياء، أنظمة معرفة RAG باستخدام Gemini وQdrant، وتطبيقات وواجهات FastAPI.",
    "en": "Sami Meqdad is a full-stack developer specialising in AI automation: n8n workflows, AI assistants, RAG knowledge systems with Gemini and Qdrant, and reliable FastAPI apps and APIs.",
}
OG_LOCALE = {"ar": "ar_AR", "en": "en_US"}

DEFAULT_SERVICES = [
    {
        "icon": "⌘",
        "title_ar": "أتمتة العمليات",
        "title_en": "Workflow automation",
        "summary_ar": "اربط أنظمتك وحوّل المهام المتكررة إلى مسارات عمل واضحة باستخدام n8n وواجهات API.",
        "summary_en": "Connect your systems and turn repetitive tasks into clear workflows with n8n and APIs.",
    },
    {
        "icon": "✳",
        "title_ar": "مساعدون أذكياء",
        "title_en": "AI assistants",
        "summary_ar": "تجارب محادثة عملية، مبنية حول معرفة مؤسستك واحتياجات المستخدمين.",
        "summary_en": "Purposeful conversational experiences built around your knowledge and your users.",
    },
    {
        "icon": "▦",
        "title_ar": "المعرفة والبيانات",
        "title_en": "Knowledge & data",
        "summary_ar": "حلول RAG لاسترجاع المعلومات وربطها بالسياق باستخدام Gemini وQdrant.",
        "summary_en": "RAG solutions that retrieve relevant information and context using Gemini and Qdrant.",
    },
    {
        "icon": "↗",
        "title_ar": "تطوير متكامل",
        "title_en": "Full-stack development",
        "summary_ar": "واجهات سلسة وخدمات FastAPI موثوقة، من تجربة المستخدم إلى تشغيل النظام.",
        "summary_en": "Intuitive interfaces and reliable FastAPI services, from user experience to deployment.",
    },
]

PROCESS = {
    "ar": [
        ("نفهم", "نحدّد المشكلة، المستخدمين والنتيجة المطلوبة."),
        ("نصمّم", "نرسم تجربة الاستخدام وبنية الحل والتكاملات."),
        ("نبني", "نطوّر النظام ونختبر المسارات خطوة بخطوة."),
        ("نطلق ونحسّن", "نجهّز التشغيل والتوثيق والتحسين المستمر."),
    ],
    "en": [
        ("Discover", "Define the problem, the users and the desired outcome."),
        ("Design", "Map the experience, architecture and integrations."),
        ("Build", "Develop the system and test each workflow."),
        ("Launch & refine", "Prepare deployment, documentation and ongoing improvement."),
    ],
}
LAB = {
    "ar": (
        ["استقبال الطلب", "فهم البيانات", "تطبيق القواعد", "توصيل النتيجة"],
        "محاكاة: يدخل طلب جديد إلى مسار العمل.",
    ),
    "en": (
        ["Receive a request", "Understand the data", "Apply the rules", "Deliver the result"],
        "Simulation: a new request enters the workflow.",
    ),
}
GLYPHS = ["⌘", "✳", "▦", "◇"]


def t(lang, ar, en):
    return ar if lang == "ar" else en


def local(record, key, lang):
    return (
        record.get(f"{key}_{lang}")
        or record.get(key)
        or record.get(f"{key}_ar")
        or record.get(f"{key}_en")
        or ""
    )


def has_english(record, keys=("title", "summary")):
    return all((record.get(k + "_en") or "").strip() for k in keys)


def plain(text, limit=160):
    """Markdown-ish text to a single clean line for meta descriptions."""
    value = re.sub(r"[`*#>\[\]_]", "", str(text or ""))
    value = re.sub(r"\s+", " ", value).strip()
    if len(value) > limit:
        value = value[: limit - 1].rsplit(" ", 1)[0] + "…"
    return value


# ---------------------------------------------------------------- markdown ----
def _inline(text):
    out = []
    for piece in re.split(r"(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)", text):
        if piece.startswith("**") and piece.endswith("**") and len(piece) > 4:
            out.append("<strong>" + escape(piece[2:-2]) + "</strong>")
        elif piece.startswith("`") and piece.endswith("`") and len(piece) > 2:
            out.append("<code>" + escape(piece[1:-1]) + "</code>")
        elif piece.startswith("*") and piece.endswith("*") and len(piece) > 2:
            out.append("<em>" + escape(piece[1:-1]) + "</em>")
        else:
            out.append(escape(piece))
    return "".join(out)


def markdown(text, base_heading=2, min_heading=2):
    """Mirror of main.js safeMarkdown(): a strict, escape-everything subset."""
    html, code, list_tag = [], None, None

    def close_list():
        nonlocal list_tag
        if list_tag:
            html.append(f"</{list_tag}>")
            list_tag = None

    for line in str(text or "").split("\n"):
        if re.match(r"^\s*```", line):
            if code is not None:
                html.append("<pre><code>" + escape("\n".join(code)) + "</code></pre>")
                code = None
            else:
                close_list()
                code = []
            continue
        if code is not None:
            code.append(line)
            continue
        if not line.strip():
            close_list()
            continue
        heading = re.match(r"^\s*(#{1,6})\s+(.+)", line)
        item = re.match(r"^\s*([-*+] |\d+[.)] )(.+)", line)
        if item:
            kind = "ol" if item.group(1)[0].isdigit() else "ul"
            if list_tag != kind:
                close_list()
                html.append(f"<{kind}>")
                list_tag = kind
            html.append("<li>" + _inline(item.group(2)) + "</li>")
            continue
        close_list()
        if heading:
            level = max(min_heading, min(len(heading.group(1)) + base_heading - 1, 4))
            html.append(f"<h{level}>" + _inline(heading.group(2)) + f"</h{level}>")
        elif line.startswith("> "):
            html.append("<blockquote>" + _inline(line[2:]) + "</blockquote>")
        else:
            html.append("<p>" + _inline(line) + "</p>")
    close_list()
    if code is not None:
        html.append("<pre><code>" + escape("\n".join(code)) + "</code></pre>")
    return '<div class="formatted">' + "".join(html) + "</div>"


# ------------------------------------------------------------------- urls ----
def home_path(lang):
    return "/" if lang == "ar" else "/en/"


def item_path(kind, ident, lang):
    return ("" if lang == "ar" else "/en") + f"/{kind}/{ident}"


def social_links(content, lang):
    links = []
    for key, label in (
        ("github", "GitHub"),
        ("linkedin", "LinkedIn"),
        ("email", t(lang, "البريد الإلكتروني", "Email")),
    ):
        value = (content.get(key) or "").strip()
        if not value:
            continue
        if key == "email":
            if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
                continue
            links.append(f'<a href="mailto:{escape(value, True)}">{label} ↗</a>')
        elif value.startswith("https://"):
            links.append(
                f'<a href="{escape(value, True)}" target="_blank" rel="noopener noreferrer me">{label} ↗</a>'
            )
    return "".join(links)


def same_as(content):
    return [
        content[k]
        for k in ("github", "linkedin")
        if (content.get(k) or "").startswith("https://")
    ]


# ------------------------------------------------------------ fragments ----
def render_services(services, lang):
    records = services if services is not None else DEFAULT_SERVICES
    cards = []
    for i, s in enumerate(records):
        body = (
            f'<span class="service-icon" aria-hidden="true">{escape(s.get("icon") or GLYPHS[i % 4])}</span>'
            f"<h3>{escape(local(s, 'title', lang))}</h3>"
            f"<p>{escape(local(s, 'summary', lang))}</p>"
            f'<a href="#request">{t(lang, "ناقش فكرتك ↗", "Discuss your idea ↗")}</a>'
        )
        details = local(s, "details", lang)
        if details:
            body += f"<details><summary>{t(lang, 'التفاصيل', 'Details')}</summary>{markdown(details, 4)}</details>"
        cards.append(f'<article class="service-card">{body}</article>')
    if not cards:
        cards.append(
            '<p class="empty-state">'
            + t(
                lang,
                "الخدمات قيد التحديث. أرسل فكرتك لنناقش الحل المناسب.",
                "Services are being updated. Send your idea to discuss the right solution.",
            )
            + "</p>"
        )
    return "".join(cards)


def render_projects(projects, lang):
    cards = []
    for i, p in enumerate(projects):
        title = escape(local(p, "title", lang))
        category = escape(p.get("category") or "")
        href = item_path("projects", p["id"], lang)
        image = p.get("image") or ""
        if re.fullmatch(r"/media/[\w.-]+", image):
            visual = f'<img src="{escape(image, True)}" alt="{title}" loading="lazy" decoding="async" width="1200" height="800">'
        else:
            visual = f'<span class="project-glyph" aria-hidden="true">{GLYPHS[i % 4]}</span>'
        visual += f'<span class="project-number">{i + 1:02d} / {category}</span>'
        body = ""
        if i == 0:
            body += f'<span class="featured-label">{t(lang, "مشروع تحت الضوء", "PROJECT SPOTLIGHT")}</span>'
        body += (
            f'<span class="tag">{category}</span>'
            f'<h3><a class="card-title-link" href="{href}">{title}</a></h3>'
            f"<p>{escape(local(p, 'summary', lang))}</p>"
            f'<div class="card-links"><a class="text-link" href="{href}">{t(lang, "دراسة الحالة: ", "Case study: ")}{title} ↗</a>'
        )
        link = p.get("link") or ""
        if re.match(r"^https?://", link):
            body += f'<a class="text-link" href="{escape(link, True)}" target="_blank" rel="noopener noreferrer">{t(lang, "زيارة المشروع ↗", "Visit project ↗")}</a>'
        body += "</div>"
        cls = "project-card" + (" featured-project" if i == 0 else "")
        cards.append(
            f'<article class="{cls}"><div class="project-visual">{visual}</div><div class="project-body">{body}</div></article>'
        )
    if not cards:
        cards.append(
            '<p class="empty-state">'
            + t(
                lang,
                "لا توجد مشاريع منشورة حاليًا. تواصل معي لمناقشة فكرتك.",
                "No projects are published yet. Get in touch to discuss your idea.",
            )
            + "</p>"
        )
    return "".join(cards)


def render_articles(articles, lang):
    cards = []
    for a in articles:
        title = escape(local(a, "title", lang))
        href = item_path("articles", a["id"], lang)
        cards.append(
            '<article class="article-card">'
            f'<span class="tag">{t(lang, "معرفة وأفكار", "INSIGHTS")}</span>'
            f'<h3><a class="card-title-link" href="{href}">{title}</a></h3>'
            f"<p>{escape(local(a, 'summary', lang))}</p>"
            f'<a class="text-link" href="{href}">{t(lang, "اقرأ المقال: ", "Read: ")}{title} ↗</a>'
            "</article>"
        )
    if not cards:
        cards.append(
            '<p class="empty-state">'
            + t(lang, "لا توجد مقالات منشورة حتى الآن.", "No articles published yet.")
            + "</p>"
        )
    return "".join(cards)


def render_process(lang):
    return "".join(
        f'<article class="process-card"><span>{i + 1:02d}</span><h3>{escape(a)}</h3><p>{escape(b)}</p></article>'
        for i, (a, b) in enumerate(PROCESS[lang])
    )


def render_lab(lang):
    labels, _ = LAB[lang]
    return "".join(
        f'<div class="lab-step{" active" if i == 0 else ""}"><span>{i + 1:02d}</span><strong>{escape(v)}</strong></div>'
        for i, v in enumerate(labels)
    )


# ------------------------------------------------------- html templating ----
def fill(html, ident, inner):
    """Replace the inner HTML of the first element carrying id=ident."""
    pattern = re.compile(
        r'(<(\w+)\b[^>]*\bid="' + re.escape(ident) + r'"[^>]*>)(.*?)(</\2>)', re.S
    )
    return pattern.sub(lambda m: m.group(1) + inner + m.group(4), html, count=1)


def translate(html, lang):
    """Swap the bilingual data-* attributes server-side so /en/ is real English."""
    if lang == "ar":
        return html
    pattern = re.compile(
        r'(<(\w+)\b[^>]*?\sdata-en="([^"]*)"[^>]*>)(.*?)(</\2>)', re.S
    )

    def swap(m):
        text = m.group(3).replace("\\n", "<br>")
        return m.group(1) + text + m.group(5)

    html = pattern.sub(swap, html)
    html = re.sub(
        r'(\sdata-placeholder-en="([^"]*)"[^>]*?\splaceholder=")[^"]*"',
        lambda m: m.group(1) + m.group(2) + '"',
        html,
    )
    html = re.sub(
        r'(\sdata-label-en="([^"]*)"[^>]*?\saria-label=")[^"]*"',
        lambda m: m.group(1) + m.group(2) + '"',
        html,
    )
    return html


def json_ld(data):
    text = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    text = text.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    return f'<script type="application/ld+json">{text}</script>'


def head_tags(
    *, base, path, lang, title, description, alternates, og_type="website", image=None
):
    url = base + path
    image = image or base + "/static/og-image.png"
    tags = [
        f'<link rel="canonical" href="{escape(url, True)}">',
        '<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">',
        f'<meta name="author" content="{PERSON[lang]}">',
    ]
    for code, href in alternates.items():
        tags.append(
            f'<link rel="alternate" hreflang="{code}" href="{escape(base + href, True)}">'
        )
    tags += [
        f'<meta property="og:type" content="{og_type}">',
        f'<meta property="og:site_name" content="{SITE_NAME}">',
        f'<meta property="og:locale" content="{OG_LOCALE[lang]}">',
        f'<meta property="og:locale:alternate" content="{OG_LOCALE["en" if lang == "ar" else "ar"]}">',
        f'<meta property="og:url" content="{escape(url, True)}">',
        f'<meta property="og:title" content="{title}">',
        f'<meta property="og:description" content="{description}">',
        f'<meta property="og:image" content="{escape(image, True)}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:image:alt" content="{SITE_NAME} — {PERSON[lang]}">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{title}">',
        f'<meta name="twitter:description" content="{description}">',
        f'<meta name="twitter:image" content="{escape(image, True)}">',
    ]
    return "".join(tags)


def common_head(lang):
    v = ASSET_VERSION
    return (
        '<meta name="color-scheme" content="dark light">'
        '<link rel="icon" href="/favicon.ico" sizes="32x32">'
        '<link rel="icon" href="/static/mark.svg" type="image/svg+xml">'
        '<link rel="apple-touch-icon" href="/static/apple-touch-icon.png">'
        '<link rel="manifest" href="/manifest.webmanifest">'
        '<link rel="preload" href="/static/fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2" as="font" type="font/woff2" crossorigin>'
        '<link rel="preload" href="/static/fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2" as="font" type="font/woff2" crossorigin>'
    )


def graph(base, lang, content, services):
    person_id, org_id, site_id = base + "/#person", base + "/#organization", base + "/#website"
    services = services if services is not None else DEFAULT_SERVICES
    person = {
        "@type": "Person",
        "@id": person_id,
        "name": PERSON[lang],
        "alternateName": [PERSON["en" if lang == "ar" else "ar"], "Sami Hassan Miqdad", SITE_NAME],
        "jobTitle": t(lang, "مطوّر تطبيقات متكاملة ومتخصص أتمتة بالذكاء الاصطناعي", "Full-Stack Developer & AI Automation Specialist"),
        "url": base + "/",
        "image": base + "/static/icon-512.png",
        "knowsAbout": ["AI automation", "n8n", "Retrieval-Augmented Generation", "Gemini", "Qdrant", "Python", "FastAPI", "JavaScript", "Docker"],
        "worksFor": {"@id": org_id},
    }
    links = same_as(content)
    if links:
        person["sameAs"] = links
    org = {
        "@type": "Organization",
        "@id": org_id,
        "name": SITE_NAME,
        "url": base + "/",
        "logo": {"@type": "ImageObject", "url": base + "/static/icon-512.png", "width": 512, "height": 512},
        "founder": {"@id": person_id},
        "description": DEFAULT_DESCRIPTION[lang],
        "makesOffer": [
            {
                "@type": "Offer",
                "itemOffered": {
                    "@type": "Service",
                    "name": local(s, "title", lang),
                    "description": plain(local(s, "summary", lang), 300),
                    "provider": {"@id": org_id},
                },
            }
            for s in services
        ],
    }
    email = content.get("email") or ""
    if re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        org["email"] = email
        org["contactPoint"] = {"@type": "ContactPoint", "contactType": "customer support", "email": email, "availableLanguage": ["ar", "en"]}
    if links:
        org["sameAs"] = links
    site = {
        "@type": "WebSite",
        "@id": site_id,
        "url": base + "/",
        "name": SITE_NAME,
        "alternateName": PERSON[lang],
        "inLanguage": ["ar", "en"],
        "publisher": {"@id": org_id},
    }
    page = {
        "@type": "ProfilePage",
        "@id": base + home_path(lang) + "#webpage",
        "url": base + home_path(lang),
        "name": DEFAULT_TITLE[lang],
        "inLanguage": lang,
        "isPartOf": {"@id": site_id},
        "about": {"@id": person_id},
        "mainEntity": {"@id": person_id},
    }
    return {"@context": "https://schema.org", "@graph": [site, org, person, page]}


def render_home(template, *, lang, base, content, services, projects, articles, public_json):
    html = template
    if lang == "en":
        html = html.replace('<html lang="ar" dir="rtl">', '<html lang="en" dir="ltr">', 1)
    html = translate(html, lang)

    custom_title = (content.get("site_title") or "").strip()
    title = escape(custom_title or DEFAULT_TITLE[lang], quote=True)
    description = escape(
        plain(
            content.get(f"site_description_{lang}")
            or (content.get("site_description_ar") if lang == "ar" else "")
            or DEFAULT_DESCRIPTION[lang],
            300,
        ),
        quote=True,
    )
    html = re.sub(r"<title>.*?</title>", lambda m: f"<title>{title}</title>", html, count=1, flags=re.S)
    html = re.sub(
        r'<meta name="description" content="[^"]*">',
        lambda m: f'<meta name="description" content="{description}">',
        html,
        count=1,
    )

    for ident, key in (("hero-title", "title"), ("hero-subtitle", "subtitle"), ("about-text", "about")):
        value = content.get(f"{key}_{lang}") or (content.get(key) if lang == "ar" else "")
        if value:
            html = fill(html, ident, escape(value).replace("\n", "<br>"))

    html = fill(html, "service-grid", render_services(services, lang))
    html = fill(html, "project-grid", render_projects(projects, lang))
    html = fill(html, "articles", render_articles(articles, lang))
    html = fill(html, "process-grid", render_process(lang))
    html = fill(html, "lab-steps", render_lab(lang))
    html = fill(html, "lab-text", escape(LAB[lang][1]))
    links = social_links(content, lang)
    html = fill(html, "social-links", links)
    html = fill(html, "maker-links", links)
    html = fill(html, "year", str(date.today().year))

    other = "en" if lang == "ar" else "ar"
    html = re.sub(
        r'<a id="language"[^>]*>.*?</a>',
        lambda m: (
            f'<a id="language" class="icon-btn" href="{home_path(other)}" hreflang="{other}" lang="{other}" '
            f'aria-label="{t(lang, "Switch to English", "التبديل إلى العربية")}">{t(lang, "EN", "ع")}</a>'
        ),
        html,
        count=1,
        flags=re.S,
    )

    alternates = {"ar": "/", "en": "/en/", "x-default": "/"}
    head = (
        common_head(lang)
        + head_tags(base=base, path=home_path(lang), lang=lang, title=title, description=description, alternates=alternates)
        + json_ld(graph(base, lang, content, services))
    )
    data = (
        json.dumps(public_json, ensure_ascii=False, separators=(",", ":"))
        .replace("<", "\\u003c")
        .replace(">", "\\u003e")
        .replace("&", "\\u0026")
    )
    html = html.replace("</head>", head + "</head>", 1)
    html = html.replace(
        "</body>",
        f'<script type="application/json" id="public-data">{data}</script></body>',
        1,
    )
    return html


# --------------------------------------------------------- detail pages ----
def render_detail(*, kind, record, lang, base, content, english_available):
    title_text = local(record, "title", lang)
    summary_text = local(record, "summary", lang)
    body_text = local(record, "body" if kind == "articles" else "details", lang)
    other = "en" if lang == "ar" else "ar"
    path = item_path(kind, record["id"], lang)
    section_label = t(lang, "المعرفة", "Insights") if kind == "articles" else t(lang, "الأعمال", "Work")
    section_anchor = home_path(lang) + ("#knowledge" if kind == "articles" else "#projects")
    page_title = escape(f"{title_text} | {PERSON[lang]} — {SITE_NAME}", quote=True)
    description = escape(plain(summary_text or body_text, 160), quote=True)
    alternates = {"ar": item_path(kind, record["id"], "ar")}
    if english_available:
        alternates["en"] = item_path(kind, record["id"], "en")
    alternates["x-default"] = alternates["ar"]
    image = None
    if re.fullmatch(r"/media/[\w.-]+", record.get("image") or ""):
        image = base + record["image"]
    created = (record.get("created") or "")[:10]

    crumbs = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": SITE_NAME, "item": base + home_path(lang)},
            {"@type": "ListItem", "position": 2, "name": section_label, "item": base + section_anchor},
            {"@type": "ListItem", "position": 3, "name": title_text, "item": base + path},
        ],
    }
    if kind == "articles":
        main = {
            "@type": "BlogPosting",
            "headline": title_text[:110],
            "description": plain(summary_text, 300),
            "inLanguage": lang,
            "url": base + path,
            "mainEntityOfPage": base + path,
            "image": image or base + "/static/og-image.png",
            "author": {"@type": "Person", "name": PERSON[lang], "url": base + "/"},
            "publisher": {"@type": "Organization", "name": SITE_NAME, "logo": {"@type": "ImageObject", "url": base + "/static/icon-512.png"}},
        }
        if created:
            main["datePublished"] = created
            main["dateModified"] = created
    else:
        main = {
            "@type": "CreativeWork",
            "name": title_text,
            "description": plain(summary_text, 300),
            "inLanguage": lang,
            "url": base + path,
            "genre": record.get("category") or "",
            "image": image or base + "/static/og-image.png",
            "creator": {"@type": "Person", "name": PERSON[lang], "url": base + "/"},
        }
        if created:
            main["dateCreated"] = created

    head = (
        common_head(lang)
        + head_tags(
            base=base,
            path=path,
            lang=lang,
            title=page_title,
            description=description,
            alternates=alternates,
            og_type="article" if kind == "articles" else "website",
            image=image,
        )
        + json_ld({"@context": "https://schema.org", "@graph": [main, crumbs]})
    )
    switch = ""
    if english_available or lang == "en":
        switch = (
            f'<a id="language" class="icon-btn" href="{item_path(kind, record["id"], other)}" hreflang="{other}" lang="{other}" '
            f'aria-label="{t(lang, "Switch to English", "التبديل إلى العربية")}">{t(lang, "EN", "ع")}</a>'
        )
    figure = ""
    if image:
        figure = f'<figure class="detail-figure"><img src="{escape(record["image"], True)}" alt="{escape(title_text, True)}" width="1200" height="800" decoding="async"></figure>'
    extra = ""
    link = record.get("link") or ""
    if kind == "projects" and re.match(r"^https?://", link):
        extra = f'<p><a class="btn" href="{escape(link, True)}" target="_blank" rel="noopener noreferrer">{t(lang, "زيارة المشروع ↗", "Visit project ↗")}</a></p>'
    meta_line = escape(record.get("category") or "") if kind == "projects" else t(lang, "معرفة وأفكار", "Insights")
    time_tag = f' · <time datetime="{created}">{created}</time>' if created else ""
    dir_ = "rtl" if lang == "ar" else "ltr"
    v = ASSET_VERSION
    return f"""<!doctype html>
<html lang="{lang}" dir="{dir_}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{page_title}</title>
<meta name="description" content="{description}">
<meta name="theme-color" content="#08151c">
<link rel="stylesheet" href="/static/style.css?v={v}">
<link rel="stylesheet" href="/static/fonts.css?v={v}">
<link rel="stylesheet" href="/static/motion.css?v={v}">
<script src="/static/preferences.js?v={v}"></script>
{head}
</head>
<body class="detail-page">
<a class="skip" href="#main">{t(lang, "تجاوز إلى المحتوى", "Skip to content")}</a>
<header class="top"><div class="wrap nav-inner">
<a class="brand" href="{home_path(lang)}" aria-label="{SITE_NAME} — {t(lang, 'الصفحة الرئيسية', 'Home')}"><span class="brand-mark">S<span>↗</span></span><span>SAMI<span class="brand-sub">DEVELOPER</span></span></a>
<div class="nav-actions">{switch}<a class="btn small nav-cta" href="{home_path(lang)}#request">{t(lang, "لنبنِ شيئًا معًا ↗", "Let's build ↗")}</a></div>
</div></header>
<main id="main" class="wrap detail">
<nav class="breadcrumbs" aria-label="{t(lang, 'مسار التنقل', 'Breadcrumb')}"><ol>
<li><a href="{home_path(lang)}">{t(lang, "الرئيسية", "Home")}</a></li>
<li><a href="{section_anchor}">{section_label}</a></li>
<li aria-current="page">{escape(title_text)}</li>
</ol></nav>
<article class="detail-article">
<p class="eyebrow">{meta_line}{time_tag}</p>
<h1>{escape(title_text)}</h1>
<p class="lead">{escape(summary_text)}</p>
{figure}
{markdown(body_text, 1, 2) if body_text else ""}
{extra}
</article>
<aside class="detail-cta request-panel">
<div><p class="eyebrow">{t(lang, "الخطوة التالية تبدأ هنا", "YOUR NEXT CHAPTER STARTS HERE")}</p>
<h2>{t(lang, "لديك فكرة مشابهة؟", "Have a similar idea?")}</h2>
<p>{t(lang, "أخبرني عن التحدّي الذي تواجهه، وسأتواصل معك لمناقشة الحل المناسب.", "Tell me about your challenge and I'll get in touch to discuss the right solution.")}</p></div>
<a class="btn" href="{home_path(lang)}#request">{t(lang, "ابدأ مشروعك ↗", "Start your project ↗")}</a>
</aside>
</main>
<footer class="wrap"><div class="footer-top">
<a class="brand" href="{home_path(lang)}" dir="ltr">SAMI<span class="accent">.DEVELOPER</span></a>
<p>{t(lang, "أنظمة ذكية. أثر حقيقي.", "Intelligent systems. Real impact.")}</p>
<div id="social-links">{social_links(content, lang)}</div>
</div><div class="footer-bottom"><small>© {date.today().year} SAMI DEVELOPER</small>
<a href="{home_path(lang)}">{t(lang, "العودة للرئيسية ↑", "Back to home ↑")}</a></div></footer>
</body>
</html>"""


def render_404(lang="ar"):
    v = ASSET_VERSION
    return f"""<!doctype html>
<html lang="{lang}" dir="{'rtl' if lang == 'ar' else 'ltr'}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{t(lang, "الصفحة غير موجودة", "Page not found")} | {SITE_NAME}</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/static/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/static/style.css?v={v}"><link rel="stylesheet" href="/static/fonts.css?v={v}"><link rel="stylesheet" href="/static/motion.css?v={v}">
<script src="/static/preferences.js?v={v}"></script></head>
<body class="detail-page"><main id="main" class="wrap detail not-found">
<p class="eyebrow">404</p><h1>{t(lang, "هذه الصفحة غير موجودة.", "This page doesn't exist.")}</h1>
<p class="lead">{t(lang, "ربما تغيّر الرابط أو حُذف المحتوى.", "The link may have changed or the content was removed.")}</p>
<p><a class="btn" href="{home_path(lang)}">{t(lang, "العودة إلى الرئيسية ↗", "Back to home ↗")}</a></p>
</main></body></html>"""


def sitemap(base, projects, articles, today):
    def url(loc, alts, lastmod, priority):
        links = "".join(
            f'<xhtml:link rel="alternate" hreflang="{code}" href="{escape(base + href)}"/>'
            for code, href in alts.items()
        )
        return f"<url><loc>{escape(base + loc)}</loc>{links}<lastmod>{lastmod}</lastmod><priority>{priority}</priority></url>"

    home_alts = {"ar": "/", "en": "/en/", "x-default": "/"}
    out = [url("/", home_alts, today, "1.0"), url("/en/", home_alts, today, "0.9")]
    for kind, records in (("projects", projects), ("articles", articles)):
        for r in records:
            lastmod = (r.get("created") or "")[:10] or today
            alts = {"ar": item_path(kind, r["id"], "ar")}
            english = has_english(r)
            if english:
                alts["en"] = item_path(kind, r["id"], "en")
            alts["x-default"] = alts["ar"]
            out.append(url(alts["ar"], alts, lastmod, "0.8"))
            if english:
                out.append(url(alts["en"], alts, lastmod, "0.7"))
    return (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
        + "".join(out)
        + "</urlset>"
    )
