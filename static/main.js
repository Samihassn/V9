'use strict';
const $ = s => document.querySelector(s),
  $$ = s => [...document.querySelectorAll(s)];
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
let language = document.documentElement.lang === 'en' ? 'en' : 'ar',
  publicData = null,
  loadError = false,
  step = 0,
  task = 'summarize';
const t = (ar, en) => language === 'ar' ? ar : en;
const sessionId = (() => {
  try {
    let id = sessionStorage.getItem('sami_chat_id');
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem('sami_chat_id', id);
    }
    return id;
  } catch {
    return 'web-' + Math.random().toString(36).slice(2);
  }
})();
const store = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {}
};

// English detail pages exist only when the English copy was written in the dashboard.
function itemPath(kind, record) {
  const english = language === 'en' && record.title_en && record.summary_en && (kind === 'projects' || record.body_en);
  return (english ? '/en/' : '/') + kind + '/' + encodeURIComponent(record.id);
}

function localValue(record, key) {
  return record[key + '_' + language] || record[key] || record[key + '_ar'] || record[key + '_en'] || '';
}

function applyLanguage() {
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  $$('[data-ar]').forEach(n => {
    n.textContent = n.dataset[language].replace(/\\n/g, '\n');
  });
  $$('[data-placeholder-ar]').forEach(n => n.placeholder = n.dataset[language === 'ar' ? 'placeholderAr' : 'placeholderEn']);
  $$('[data-label-ar]').forEach(n => n.setAttribute('aria-label', n.dataset[language === 'ar' ? 'labelAr' : 'labelEn']));
  renderPublic();
  renderProcess();
  renderLab();
}
$('#theme').onclick = () => {
  const theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  store('sami-theme', theme);
};
matchMedia('(prefers-color-scheme: light)').addEventListener('change', e => {
  try {
    if (!localStorage.getItem('sami-theme')) document.documentElement.dataset.theme = e.matches ? 'light' : 'dark';
  } catch {}
});
$('#menu').onclick = () => {
  const expanded = $('#nav').classList.toggle('show');
  $('#menu').setAttribute('aria-expanded', String(expanded));
};
$$('#nav a').forEach(a => a.onclick = () => {
  $('#nav').classList.remove('show');
  $('#menu').setAttribute('aria-expanded', 'false');
});
$('#year').textContent = new Date().getFullYear();

function inlineMarkdown(parent, text) {
  const pieces = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  for (const p of pieces) {
    if (p.startsWith('**') && p.endsWith('**')) parent.append(el('strong', '', p.slice(2, -2)));
    else if (p.startsWith('`') && p.endsWith('`')) parent.append(el('code', '', p.slice(1, -1)));
    else if (p.startsWith('*') && p.endsWith('*')) parent.append(el('em', '', p.slice(1, -1)));
    else parent.append(document.createTextNode(p));
  }
}
// Strict DOM construction: model/CMS text is never interpreted as HTML.
function safeMarkdown(text) {
  const out = el('div', 'formatted');
  let code = null,
    codeLines = [],
    list = null;
  for (const line of String(text).split('\n')) {
    if (/^\s*```/.test(line)) {
      if (code) {
        code.textContent = codeLines.join('\n');
        code = null;
        codeLines = [];
      } else {
        const pre = el('pre');
        code = el('code');
        pre.append(code);
        out.append(pre);
      }
      list = null;
      continue;
    }
    if (code) {
      codeLines.push(line);
      continue;
    }
    if (!line.trim()) {
      list = null;
      continue;
    }
    const h = line.match(/^\s*(#{1,6})\s+(.+)/),
      li = line.match(/^\s*([-*+] |\d+[.)] )(.+)/);
    if (li) {
      const type = /^\d/.test(li[1]) ? 'ol' : 'ul';
      if (!list || list.tagName.toLowerCase() !== type) {
        list = el(type);
        out.append(list);
      }
      const n = el('li');
      inlineMarkdown(n, li[2]);
      list.append(n);
      continue;
    }
    list = null;
    const n = el(h ? 'h' + Math.min(h[1].length + 1, 4) : line.startsWith('> ') ? 'blockquote' : 'p');
    inlineMarkdown(n, h ? h[2] : line.replace(/^> /, ''));
    out.append(n);
  }
  if (code) code.textContent = codeLines.join('\n');
  return out;
}

function copyButton(text) {
  const b = el('button', 'copy', t('نسخ', 'Copy'));
  b.type = 'button';
  b.onclick = async () => {
    try {
      await navigator.clipboard.writeText(text);
      b.textContent = t('تم النسخ ✓', 'Copied ✓');
    } catch {
      b.textContent = t('تعذّر النسخ؛ حدّد النص يدويًا', 'Copy unavailable; select the text');
    }
  };
  return b;
}

function showReply(target, text) {
  target.replaceChildren(safeMarkdown(text), copyButton(text));
}

function errorMessage(status) {
  return status === 429 ? t('طلبات كثيرة. انتظر قليلًا ثم حاول مجددًا.', 'Too many requests. Wait a little and try again.') : status === 503 ? t('خدمة الذكاء الاصطناعي غير مفعّلة حاليًا. يمكنك إرسال طلب مشروع.', 'The AI service is not configured yet. You can send a project request.') : status === 413 ? t('حجم المرفق أكبر من 5MB.', 'The attachment exceeds 5MB.') : status === 415 ? t('نوع الملف غير مدعوم. استخدم PDF أو PNG أو JPEG أو WebP.', 'Unsupported file. Use PDF, PNG, JPEG or WebP.') : status === 422 || status === 400 ? t('تحقّق من الحقول المدخلة ثم حاول مجددًا.', 'Please check your input and try again.') : t('تعذّر الاتصال بالخدمة. حاول مجددًا بعد قليل.', 'Unable to connect to the service. Please try again shortly.');
}
async function api(path, options = {}) {
  const controller = new AbortController(),
    timer = setTimeout(() => controller.abort(), 80000);
  try {
    const response = await fetch(path, {
      ...options,
      signal: controller.signal
    });
    if (!response.ok) throw new Error(errorMessage(response.status));
    return await response.json();
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(t('استغرق الرد وقتًا طويلًا. حاول مجددًا.', 'The request timed out. Please try again.'));
    if (e instanceof TypeError) throw new Error(errorMessage(0));
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
const chatApi = async message => {
  const data = await api('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      sessionId
    })
  });
  if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error(errorMessage(502));
  return data.reply;
};
const defaults = [{
  icon: '⌘',
  ar: ['أتمتة العمليات', 'اربط أنظمتك وحوّل المهام المتكررة إلى مسارات عمل واضحة باستخدام n8n وواجهات API.'],
  en: ['Workflow automation', 'Connect your systems and turn repetitive tasks into clear workflows with n8n and APIs.']
}, {
  icon: '✳',
  ar: ['مساعدون أذكياء', 'تجارب محادثة عملية، مبنية حول معرفة مؤسستك واحتياجات المستخدمين.'],
  en: ['AI assistants', 'Purposeful conversational experiences built around your knowledge and your users.']
}, {
  icon: '▦',
  ar: ['المعرفة والبيانات', 'حلول RAG لاسترجاع المعلومات وربطها بالسياق باستخدام Gemini وQdrant.'],
  en: ['Knowledge & data', 'RAG solutions that retrieve relevant information and context using Gemini and Qdrant.']
}, {
  icon: '↗',
  ar: ['تطوير متكامل', 'واجهات سلسة وخدمات FastAPI موثوقة، من تجربة المستخدم إلى تشغيل النظام.'],
  en: ['Full-stack development', 'Intuitive interfaces and reliable FastAPI services, from user experience to deployment.']
}];

function renderPublic() {
  const data = publicData || {},
    content = data.content || {};
  for (const [id, key] of [
      ['hero-title', 'title'],
      ['hero-subtitle', 'subtitle'],
      ['about-text', 'about']
    ]) {
    // English pages keep their built-in English copy unless an English value was saved.
    const value = language === 'en' ? content[key + '_en'] : localValue(content, key);
    if (value) $('#' + id).textContent = value;
  }
  const description = content['site_description_' + language];
  if (description) {
    $('meta[name=description]').content = description;
    $('meta[property="og:description"]').content = description;
  }
  if (content.site_title) {
    document.title = content.site_title;
    $('meta[property="og:title"]').content = content.site_title;
  }
  const services = $('#service-grid');
  services.replaceChildren();
  const records = publicData ? (data.services || []) : null;
  (records || defaults).forEach((s, i) => {
    const card = el('article', 'service-card'),
      title = records ? localValue(s, 'title') : s[language][0],
      summary = records ? localValue(s, 'summary') : s[language][1];
    card.append(el('span', 'service-icon', s.icon || ['⌘', '✳', '▦', '↗'][i % 4]), el('h3', '', title), el('p', '', summary));
    const a = el('a', '', t('ناقش فكرتك ↗', 'Discuss your idea ↗'));
    a.href = '#request';
    card.append(a);
    if (records && localValue(s, 'details')) {
      const more = el('details');
      more.append(el('summary', '', t('التفاصيل', 'Details')), safeMarkdown(localValue(s, 'details')));
      card.append(more);
    }
    services.append(card);
  });
  if (records && !records.length) services.append(el('p', 'empty-state', t('الخدمات قيد التحديث. أرسل فكرتك لنناقش الحل المناسب.', 'Services are being updated. Send your idea to discuss the right solution.')));
  renderProjects();
  const articles = $('#articles');
  articles.replaceChildren();
  for (const a of data.articles || []) {
    const card = el('article', 'article-card');
    const href = itemPath('articles', a), heading = el('h3'), titleLink = el('a', 'card-title-link', localValue(a, 'title')), more = el('a', 'text-link', t('اقرأ المقال: ', 'Read: ') + localValue(a, 'title') + ' ↗');
    titleLink.href = more.href = href;
    heading.append(titleLink);
    card.append(el('span', 'tag', t('معرفة وأفكار', 'INSIGHTS')), heading, el('p', '', localValue(a, 'summary')), more);
    articles.append(card);
  }
  if (!articles.children.length) articles.append(el('p', 'empty-state', loadError ? errorMessage(0) : publicData ? t('لا توجد مقالات منشورة حتى الآن.', 'No articles published yet.') : t('جارٍ تحميل المقالات…', 'Loading articles…')));
  const links = $('#social-links');
  links.replaceChildren();
  for (const [key, label] of [
      ['github', 'GitHub'],
      ['linkedin', 'LinkedIn'],
      ['email', t('البريد الإلكتروني', 'Email')]
    ]) {
    const value = content[key];
    if (!value) continue;
    if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) continue;
    if (key !== 'email' && !/^https:\/\//.test(value)) continue;
    const a = el('a', '', label + ' ↗');
    a.href = key === 'email' ? 'mailto:' + value : value;
    if (key !== 'email') {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    links.append(a);
  }
  [...links.querySelectorAll('a[target]')].forEach(a => a.rel = 'noopener noreferrer me');
  const makerLinks = $('#maker-links');
  if (makerLinks) makerLinks.replaceChildren(...[...links.children].map(a => a.cloneNode(true)));
}

function renderProjects() {
  const grid = $('#project-grid');
  grid.replaceChildren();
  const query = $('#project-search').value.trim().toLocaleLowerCase();
  (publicData?.projects || []).filter(p => [localValue(p, 'title'), localValue(p, 'summary'), p.category].join(' ').toLocaleLowerCase().includes(query)).forEach((p, i) => {
    const card = el('article', 'project-card' + (i === 0 ? ' featured-project' : '')),
      visual = el('div', 'project-visual');
    if (p.image && /^\/media\/[\w.-]+$/.test(p.image)) {
      const img = el('img');
      img.src = p.image;
      img.alt = localValue(p, 'title');
      img.loading = 'lazy';
      img.decoding = 'async';
      visual.append(img);
    } else visual.append(el('span', 'project-glyph', ['⌘', '✳', '▦', '◇'][i % 4]));
    visual.append(el('span', 'project-number', String(i + 1).padStart(2, '0') + ' / ' + p.category));
    const body = el('div', 'project-body');
    if (i === 0) body.append(el('span', 'featured-label', t('مشروع تحت الضوء', 'PROJECT SPOTLIGHT')));
    const href = itemPath('projects', p), heading = el('h3'), titleLink = el('a', 'card-title-link', localValue(p, 'title'));
    titleLink.href = href;
    heading.append(titleLink);
    body.append(el('span', 'tag', p.category), heading, el('p', '', localValue(p, 'summary')));
    const actions = el('div', 'card-links'), study = el('a', 'text-link', t('دراسة الحالة: ', 'Case study: ') + localValue(p, 'title') + ' ↗');
    study.href = href;
    actions.append(study);
    if (p.link && /^https?:\/\//.test(p.link)) {
      const a = el('a', 'text-link', t('زيارة المشروع ↗', 'Visit project ↗'));
      a.href = p.link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      actions.append(a);
    }
    body.append(actions);
    card.append(visual, body);
    grid.append(card);
  });
  if (!grid.children.length) grid.append(el('p', 'empty-state', loadError ? errorMessage(0) : !publicData ? t('جارٍ تحميل المشاريع…', 'Loading projects…') : query ? t('لا توجد مشاريع مطابقة للبحث.', 'No projects match your search.') : t('لا توجد مشاريع منشورة حاليًا. تواصل معي لمناقشة فكرتك.', 'No projects are published yet. Get in touch to discuss your idea.')));
}
$('#project-search').oninput = renderProjects;

function renderProcess() {
  const values = language === 'ar' ? [
    ['نفهم', 'نحدّد المشكلة، المستخدمين والنتيجة المطلوبة.'],
    ['نصمّم', 'نرسم تجربة الاستخدام وبنية الحل والتكاملات.'],
    ['نبني', 'نطوّر النظام ونختبر المسارات خطوة بخطوة.'],
    ['نطلق ونحسّن', 'نجهّز التشغيل والتوثيق والتحسين المستمر.']
  ] : [
    ['Discover', 'Define the problem, the users and the desired outcome.'],
    ['Design', 'Map the experience, architecture and integrations.'],
    ['Build', 'Develop the system and test each workflow.'],
    ['Launch & refine', 'Prepare deployment, documentation and ongoing improvement.']
  ];
  $('#process-grid').replaceChildren(...values.map((v, i) => {
    const n = el('article', 'process-card');
    n.append(el('span', '', String(i + 1).padStart(2, '0')), el('h3', '', v[0]), el('p', '', v[1]));
    return n;
  }));
}

function renderLab() {
  const labels = language === 'ar' ? ['استقبال الطلب', 'فهم البيانات', 'تطبيق القواعد', 'توصيل النتيجة'] : ['Receive a request', 'Understand the data', 'Apply the rules', 'Deliver the result'];
  const descriptions = language === 'ar' ? ['محاكاة: يدخل طلب جديد إلى مسار العمل.', 'محاكاة: تُفحص البيانات وتُصنّف حسب نوع الطلب.', 'محاكاة: يُختار المسار المناسب بناءً على القواعد.', 'محاكاة: تُجهّز النتيجة لإرسالها إلى الجهة المعنية.'] : ['Simulation: a new request enters the workflow.', 'Simulation: information is checked and classified.', 'Simulation: the rules select the appropriate path.', 'Simulation: the result is prepared for the right recipient.'];
  $('#lab-steps').replaceChildren(...labels.map((v, i) => {
    const n = el('div', 'lab-step' + (step === i ? ' active' : ''));
    n.append(el('span', '', String(i + 1).padStart(2, '0')), el('strong', '', v));
    return n;
  }));
  $('#lab-text').textContent = descriptions[step];
}
$('#lab-next').onclick = () => {
  step = (step + 1) % 4;
  renderLab();
};
$('#project-form').onsubmit = async e => {
  e.preventDefault();
  const form = e.currentTarget,
    button = form.querySelector('[type=submit]'),
    out = $('#request-status');
  const fd = new FormData(form),
    file = fd.get('attachment');
  if (file?.size > 5 * 1024 * 1024) {
    out.className = 'error';
    out.textContent = errorMessage(413);
    return;
  }
  if (file && !file.size) fd.delete('attachment');
  button.disabled = true;
  out.className = '';
  out.textContent = t('جارٍ إرسال الطلب…', 'Sending your request…');
  try {
    const d = await api('/api/requests', {
      method: 'POST',
      body: fd
    });
    out.className = 'success';
    out.textContent = t('تم استلام طلبك. رقم المرجع: ', 'Your request was received. Reference: ') + (d.reference || '—');
    form.reset();
  } catch (err) {
    out.className = 'error';
    out.textContent = err.message;
  } finally {
    button.disabled = false;
  }
};

let chatAnimation;
function toggleChat(open) {
  const chat = $('#chat');
  if (chatAnimation) { chatAnimation.cancel(); chatAnimation = null; }
  $('#chat-open').setAttribute('aria-expanded', String(open));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (open) {
    chat.hidden = false;
    if (!reduced) chatAnimation = chat.animate([
      {opacity: 0, transform: 'translateY(16px) scale(.94)'},
      {opacity: 1, transform: 'translateY(0) scale(1)'}
    ], {duration: 300, easing: 'cubic-bezier(.16,1,.3,1)'});
    $('#chat-input').focus();
  } else {
    $('#chat-open').focus();
    if (reduced) chat.hidden = true;
    else {
      chatAnimation = chat.animate([{opacity: 1, transform: 'scale(1)'},
        {opacity: 0, transform: 'translateY(12px) scale(.96)'}], {duration: 160});
      chatAnimation.onfinish = () => { chat.hidden = true; chatAnimation = null; };
    }
  }
}
$('#chat-open').onclick = () => toggleChat($('#chat').hidden);
$('#chat-close').onclick = () => toggleChat(false);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#chat').hidden) toggleChat(false);
});

function bubble(text, who) {
  const n = el('div', 'bubble ' + who, text);
  $('#messages').append(n);
  $('#messages').scrollTop = $('#messages').scrollHeight;
  return n;
}
let chatting = false;
async function ask(message) {
  if (chatting || !message.trim()) return;
  chatting = true;
  bubble(message, 'user');
  const wait = bubble(t('SAMI AI يكتب الآن…', 'SAMI AI is thinking…'), 'bot typing');
  $('#chat-input').disabled = true;
  $('#chat-form button').disabled = true;
  try {
    showReply(wait, await chatApi(message));
  } catch (e) {
    wait.textContent = e.message;
    wait.classList.add('error');
  } finally {
    wait.classList.remove('typing');
    chatting = false;
    $('#chat-input').disabled = false;
    $('#chat-form button').disabled = false;
    if (!$('#chat').hidden) $('#chat-input').focus();
    $('#messages').scrollTop = $('#messages').scrollHeight;
  }
}
$('#chat-form').onsubmit = e => {
  e.preventDefault();
  const input = $('#chat-input'),
    text = input.value;
  if (chatting) return;
  input.value = '';
  ask(text);
};
$$('[data-prompt-ar]').forEach(b => b.onclick = () => ask(b.dataset[language === 'ar' ? 'promptAr' : 'promptEn']));
$('#architect-btn').onclick = async () => {
  const message = $('#idea').value.trim(),
    out = $('#architect-output'),
    button = $('#architect-btn');
  if (message.length < 12) {
    out.textContent = t('أضف تفاصيل أكثر عن فكرتك (12 حرفًا على الأقل).', 'Please add more detail about your idea (at least 12 characters).');
    return;
  }
  button.disabled = true;
  out.textContent = t('جارٍ إعداد التصوّر التقني…', 'Preparing your technical blueprint…');
  try {
    const d = await api('/api/ai/architect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        sessionId,
        language
      })
    });
    if (!d.sections || typeof d.sections !== 'object') throw new Error(errorMessage(502));
    const titles = {
        summary: ['ملخص المشروع', 'Project summary'],
        problem: ['المشكلة', 'The problem'],
        solution: ['الحل التقني', 'Technical solution'],
        components: ['المكونات والتقنيات', 'Components & technology'],
        integrations: ['التكاملات', 'Integrations'],
        workflow: ['سير العمل', 'Workflow'],
        phases: ['مراحل التنفيذ', 'Implementation phases'],
        questions: ['أسئلة استكمال المتطلبات', 'Requirements questions']
      },
      grid = el('div', 'blueprint-grid'),
      text = [];
    Object.entries(titles).forEach(([key, title], i) => {
      const value = d.sections[key],
        body = Array.isArray(value) ? value.map(x => '- ' + String(x)).join('\n') : String(value || t('لم يقدّم المساعد تفاصيل لهذا القسم.', 'The assistant did not provide details for this section.'));
      const card = el('article', 'blueprint-card');
      card.append(el('h3', '', String(i + 1).padStart(2, '0') + ' / ' + t(...title)));
      if (key === 'workflow') {
        const lines = (Array.isArray(value) ? value : String(value || '').split('\n')).map(x => String(x).replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim()).filter(Boolean);
        if (lines.length > 1) {
          const flow = el('ol', 'workflow-output');
          lines.forEach(line => flow.append(el('li', '', line)));
          card.append(flow);
        } else card.append(safeMarkdown(body));
      } else card.append(safeMarkdown(body));
      grid.append(card);
      text.push(t(...title) + '\n' + body);
    });
    const bar = el('div', 'blueprint-actions');
    bar.append(el('p', 'muted', t('تصوّر أولي يحتاج مراجعة تقنية وتأكيد المتطلبات.', 'An initial blueprint requiring technical review and confirmed requirements.')), copyButton(text.join('\n\n')));
    out.replaceChildren(bar, grid);
  } catch (e) {
    out.replaceChildren(el('p', 'error', e.message));
  } finally {
    button.disabled = false;
  }
};
$$('[data-task]').forEach(b => b.onclick = () => {
  task = b.dataset.task;
  $$('[data-task]').forEach(x => {
    x.classList.toggle('active', x === b);
    x.setAttribute('aria-pressed', String(x === b));
  });
});
$('#playground-run').onclick = async () => {
  const text = $('#playground-input').value.trim(),
    button = $('#playground-run'),
    out = $('#playground-output');
  if (text.length < 12) {
    out.textContent = t('أضف نصًا أطول قليلًا (12 حرفًا على الأقل).', 'Please add a little more text (at least 12 characters).');
    return;
  }
  button.disabled = true;
  out.textContent = t('جارٍ التحليل…', 'Analyzing…');
  const prompt = {
    summarize: t('لخّص النص التالي بالعربية:\n', 'Summarize the following text in English:\n'),
    extract: t('استخرج حقائق النص دون اختراع بيانات، وأجب بالعربية:\n', 'Extract facts without inventing information; answer in English:\n'),
    improve: t('حسّن النص مع الحفاظ على معناه، وأجب بالعربية:\n', 'Improve the writing while preserving meaning; answer in English:\n')
  };
  try {
    showReply(out, await chatApi(prompt[task] + text));
  } catch (e) {
    out.replaceChildren(el('p', 'error', e.message));
  } finally {
    button.disabled = false;
  }
};
// The server embeds the same data it used to render the page, so no extra request is needed.
try {
  publicData = JSON.parse($('#public-data')?.textContent || 'null');
} catch {
  publicData = null;
}
applyLanguage();
if (!publicData) api('/api/public').then(data => {
  publicData = data;
  renderPublic();
}).catch(() => {
  loadError = true;
  renderPublic();
});
