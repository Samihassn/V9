'use strict';
const $ = s => document.querySelector(s),
  E = (tag,
    text,
    cls) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (cls) el.className = cls;
    return el
  };
const texts = {
  ar: {
    viewSite: 'معاينة الموقع ↗',
    private: 'مساحة الإدارة الخاصة',
    welcome: 'أهلًا بعودتك، سامي.',
    loginDescription: 'المشاريع، المحتوى، وطلبات العملاء. كل شيء في مكان واحد.',
    adminToken: 'مفتاح الإدارة',
    signIn: 'دخول آمن ↗',
    workspace: 'مساحة العمل',
    privateSession: 'جلسة إدارة خاصة',
    logout: 'تسجيل الخروج',
    controlCenter: 'مركز التحكم',
    dashboardIntro: 'تفاصيل صغيرة. تجربة أفضل. تحكّم بكل ما يظهر على موقعك.',
    refresh: '↻ تحديث',
    overview: 'نظرة عامة',
    leads: 'طلبات العملاء',
    projects: 'المشاريع',
    articles: 'المقالات',
    services: 'الخدمات',
    content: 'المحتوى والإعدادات',
    knowledge: 'ملاحظات المعرفة',
    system: 'حالة التكاملات',
    totalLeads: 'إجمالي الطلبات',
    newLeads: 'طلبات جديدة',
    saved: 'تم حفظ التغييرات.',
    deleted: 'تم حذف السجل.',
    loaded: 'تم تحديث البيانات.',
    save: 'حفظ',
    new: 'جديد',
    edit: 'تعديل',
    delete: 'حذف',
    confirmDelete: 'حذف هذا السجل؟ لا يمكن التراجع عن الحذف من الواجهة.',
    empty: 'لا توجد سجلات بعد.',
    emptyTip: 'ستظهر هنا البيانات التي تُضاف إلى الموقع.',
    published: 'منشور',
    draft: 'مسودة',
    title_ar: 'العنوان بالعربية',
    title_en: 'العنوان بالإنجليزية',
    category: 'التصنيف',
    link: 'رابط المشروع (اختياري)',
    serviceDetailsAr: 'تفاصيل الخدمة بالعربية',
    serviceDetailsEn: 'تفاصيل الخدمة بالإنجليزية',
    summary_ar: 'الملخص بالعربية',
    summary_en: 'الملخص بالإنجليزية',
    details_ar: 'تفاصيل دراسة الحالة بالعربية',
    details_en: 'تفاصيل دراسة الحالة بالإنجليزية',
    body_ar: 'نص المقال بالعربية',
    body_en: 'نص المقال بالإنجليزية',
    icon: 'الرمز (اختياري)',
    image: 'رابط الصورة',
    upload: 'رفع صورة PNG / JPG / WEBP — حتى 5MB',
    removeImage: 'إزالة الصورة',
    imageAlt: 'صورة المشروع',
    addProject: 'إضافة / تعديل مشروع',
    addArticle: 'إضافة / تعديل مقال',
    addService: 'إضافة / تعديل خدمة',
    addKnowledge: 'إضافة ملاحظة',
    knowledgeNote: 'هذه الملاحظات محفوظة محليًا للإدارة، ولا تتم مزامنتها أو فهرستها تلقائيًا في Qdrant.',
    title: 'العنوان',
    body: 'المحتوى',
    contact: 'وسيلة التواصل',
    email: 'البريد الإلكتروني',
    service: 'نوع المشروع',
    deadline: 'الموعد المستهدف',
    created: 'تاريخ الاستلام',
    status: 'حالة الطلب',
    reviewing: 'قيد المراجعة',
    contacted: 'تم التواصل',
    closed: 'مغلق',
    download: 'تنزيل المرفق الخاص ↧',
    notification: 'إشعار n8n',
    notificationSent: 'تم الإرسال',
    notificationFailed: 'تعذّر الإرسال — الطلب محفوظ',
    notificationDisabled: 'غير مفعّل',
    notificationUnknown: 'غير مسجل',
    details: 'عرض تفاصيل الطلب',
    notSet: 'غير محدد',
    loginRequired: 'سجّل الدخول للمتابعة.',
    error: 'تعذّر إتمام العملية. حاول مرة أخرى.',
    networkError: 'تعذّر الاتصال بالخادم. تحقق من الشبكة وحاول مجددًا.',
    authError: 'انتهت الجلسة أو أن مفتاح الدخول غير صحيح.',
    validationError: 'تحقق من الحقول المطلوبة وأطوال النصوص.',
    rateError: 'طلبات كثيرة. انتظر قليلًا ثم حاول مجددًا.',
    uploadError: 'ملف غير صالح أو أكبر من الحجم المسموح.',
    serverError: 'الخدمة غير متاحة مؤقتًا. حاول لاحقًا.',
    theme: 'تغيير المظهر',
    language: 'تغيير اللغة',
    heroTitleAr: 'عنوان الرئيسية بالعربية',
    heroTitleEn: 'عنوان الرئيسية بالإنجليزية',
    subtitleAr: 'وصف الرئيسية بالعربية',
    subtitleEn: 'وصف الرئيسية بالإنجليزية',
    aboutAr: 'نبذة بالعربية',
    aboutEn: 'نبذة بالإنجليزية',
    siteTitle: 'اسم الموقع',
    seoAr: 'وصف محركات البحث بالعربية',
    seoEn: 'وصف محركات البحث بالإنجليزية',
    settingsNote: 'يُحفظ كل حقل على حدة. لا تضع مفاتيح API أو أسرارًا في المحتوى العام.',
    configured: 'إعدادات الربط موجودة',
    unconfigured: 'غير مهيأ',
    systemNote: 'هذه حالة إعدادات الربط فقط، وليست اختبار اتصال مباشرًا أو مراقبة لتنفيذ n8n أو Gemini أو Qdrant.',
    api: 'واجهة الموقع',
    connected: 'تم الوصول بنجاح',
    ai: 'مساعد الذكاء الاصطناعي',
    webhookNote: 'تُضبط الأسرار وروابط Webhook في متغيرات بيئة الخادم.',
    overviewTitle: 'موقعك، من مكان واحد.',
    overviewText: 'أضف دراسات حالة باللغتين، حدّث خدماتك، وتابع طلبات المشاريع من الاستلام حتى الإغلاق.',
    openInbox: 'فتح طلبات العملاء',
    manageProjects: 'إدارة المشاريع',
    all: 'الكل',
    filterStatus: 'تصفية حسب الحالة',
    busy: 'جارٍ الحفظ…',
    requestRef: 'رقم الطلب',
    draftHint: 'المسودات لا تظهر للزوار.',
    count: 'سجل',
    updatedStatus: 'تم تحديث حالة الطلب.',
    sizeLimit: 'الحد الأقصى للصورة 5MB.'
  },
  en: {
    viewSite: 'View website ↗',
    private: 'PRIVATE WORKSPACE',
    welcome: 'Welcome back, Sami.',
    loginDescription: 'Projects, content, and client inquiries. Everything in one place.',
    adminToken: 'Admin token',
    signIn: 'Secure sign in ↗',
    workspace: 'WORKSPACE',
    privateSession: 'Private admin session',
    logout: 'Sign out',
    controlCenter: 'CONTROL CENTER',
    dashboardIntro: 'Small details. Better experiences. Manage everything on your website.',
    refresh: '↻ Refresh',
    overview: 'Overview',
    leads: 'Client inquiries',
    projects: 'Projects',
    articles: 'Articles',
    services: 'Services',
    content: 'Content & settings',
    knowledge: 'Knowledge notes',
    system: 'Integrations',
    totalLeads: 'Total inquiries',
    newLeads: 'New inquiries',
    saved: 'Changes saved.',
    deleted: 'Record deleted.',
    loaded: 'Data refreshed.',
    save: 'Save',
    new: 'New',
    edit: 'Edit',
    delete: 'Delete',
    confirmDelete: 'Delete this record? This cannot be undone from the dashboard.',
    empty: 'No records yet.',
    emptyTip: 'Content added to your website will appear here.',
    published: 'Published',
    draft: 'Draft',
    title_ar: 'Arabic title',
    title_en: 'English title',
    category: 'Category',
    link: 'Project URL (optional)',
    serviceDetailsAr: 'Arabic service details',
    serviceDetailsEn: 'English service details',
    summary_ar: 'Arabic summary',
    summary_en: 'English summary',
    details_ar: 'Arabic case study details',
    details_en: 'English case study details',
    body_ar: 'Arabic article body',
    body_en: 'English article body',
    icon: 'Icon (optional)',
    image: 'Image path',
    upload: 'Upload PNG / JPG / WEBP — up to 5MB',
    removeImage: 'Remove image',
    imageAlt: 'Project image',
    addProject: 'Create / edit project',
    addArticle: 'Create / edit article',
    addService: 'Create / edit service',
    addKnowledge: 'Add a note',
    knowledgeNote: 'These are local administrative notes. They are not automatically indexed or synchronized to Qdrant.',
    title: 'Title',
    body: 'Content',
    contact: 'Contact method',
    email: 'Email address',
    service: 'Project type',
    deadline: 'Target date',
    created: 'Received',
    status: 'Inquiry status',
    reviewing: 'In review',
    contacted: 'Contacted',
    closed: 'Closed',
    download: 'Download private attachment ↧',
    notification: 'n8n notification',
    notificationSent: 'Sent',
    notificationFailed: 'Delivery failed — inquiry saved',
    notificationDisabled: 'Not enabled',
    notificationUnknown: 'Not recorded',
    details: 'View inquiry details',
    notSet: 'Not specified',
    loginRequired: 'Sign in to continue.',
    error: 'Unable to complete the action. Please try again.',
    networkError: 'Unable to reach the server. Check your connection and retry.',
    authError: 'Your session expired or the sign-in token is incorrect.',
    validationError: 'Check required fields and text lengths.',
    rateError: 'Too many requests. Wait a moment and try again.',
    uploadError: 'Invalid file or the file exceeds the size limit.',
    serverError: 'Service temporarily unavailable. Please retry later.',
    theme: 'Toggle appearance',
    language: 'Switch language',
    heroTitleAr: 'Arabic homepage title',
    heroTitleEn: 'English homepage title',
    subtitleAr: 'Arabic homepage description',
    subtitleEn: 'English homepage description',
    aboutAr: 'Arabic about text',
    aboutEn: 'English about text',
    siteTitle: 'Website name',
    seoAr: 'Arabic SEO description',
    seoEn: 'English SEO description',
    settingsNote: 'Each field is saved separately. Never put API keys or secrets in public content.',
    configured: 'Integration configured',
    unconfigured: 'Not configured',
    systemNote: 'This shows configuration only. It is not a live connectivity test or execution monitor for n8n, Gemini, or Qdrant.',
    api: 'Website API',
    connected: 'Successfully reached',
    ai: 'AI assistant',
    webhookNote: 'Configure secrets and webhook URLs in server environment variables.',
    overviewTitle: 'Your website. One workspace.',
    overviewText: 'Publish bilingual case studies, update services, and follow inquiries from first contact to completion.',
    openInbox: 'Open client inquiries',
    manageProjects: 'Manage projects',
    all: 'All',
    filterStatus: 'Filter by status',
    busy: 'Saving…',
    requestRef: 'Reference',
    draftHint: 'Drafts are hidden from visitors.',
    count: 'records',
    updatedStatus: 'Inquiry status updated.',
    sizeLimit: 'Maximum image size is 5MB.'
  }
};
const preferences = {
  get(key) {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set(key,
    value) {
    try {
      localStorage.setItem(key,
        value)
    } catch {}
  }
};
let lang = preferences.get('sami-language') || preferences.get('sami-lang') || 'ar',
  theme = preferences.get('sami-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'),
  active = 'overview',
  state = null;
if (!texts[lang]) lang = 'ar';
const t = k => texts[lang][k] || k;
const tabs = [
  ['overview',
    '◫'
  ],
  ['leads',
    '✉'
  ],
  ['projects',
    '▦'
  ],
  ['articles',
    '▤'
  ],
  ['services',
    '◇'
  ],
  ['content',
    '⚙'
  ],
  ['knowledge',
    '⌘'
  ],
  ['system',
    '◎'
  ]
];

function notify(key,
  error = false) {
  const box = $('#admin-msg');
  box.className = 'notice' + (error ? ' error' : '');
  box.textContent = t(key);
}

function errorKey(e) {
  return e.status === 401 ? 'authError' : e.status === 422 || e.status === 400 ? 'validationError' : e.status === 429 ? 'rateError' : e.status === 413 || e.status === 415 ? 'uploadError' : e.status >= 500 ? 'serverError' : e.status ? 'error' : 'networkError'
}
async function api(url,
  method = 'GET',
  data) {
  const opts = {
    method,
    credentials: 'same-origin',
    headers: {
      'X-SAMI-Admin': '1'
    }
  };
  if (data !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(data)
  }
  const r = await fetch(url,
    opts);
  if (!r.ok) {
    const e = new Error('Request failed');
    e.status = r.status;
    throw e
  }
  return r.json()
}

function applyPreferences() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('[data-t]').forEach(el => el.textContent = t(el.dataset.t));
  $('#lang').textContent = lang === 'ar' ? 'EN' : 'عربي';
  $('#lang').ariaLabel = t('language');
  $('#theme').ariaLabel = t('theme');
  $('#theme').textContent = theme === 'dark' ? '☀' : '◐';
  document.title = (lang === 'ar' ? 'لوحة الإدارة' : 'Control Center') + ' — SAMI';
  if (state) render();
}
$('#lang').onclick = () => {
  lang = lang === 'ar' ? 'en' : 'ar';
  preferences.set('sami-language',
    lang);
  applyPreferences()
};
$('#theme').onclick = () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  preferences.set('sami-theme',
    theme);
  document.documentElement.dataset.theme = theme;
  $('#theme').textContent = theme === 'dark' ? '☀' : '◐'
};
async function load(showNotice = false) {
  try {
    const [stats,
      leads,
      projects,
      articles,
      services,
      content,
      knowledge
    ] = await Promise.all(['overview',
      'leads',
      'projects',
      'articles',
      'services',
      'content',
      'knowledge'
    ].map(x => api('/api/admin/' + x)));
    state = {
      stats,
      leads,
      projects,
      articles,
      services,
      content,
      knowledge
    };
    $('#login-panel').hidden = true;
    $('#dashboard').hidden = false;
    render();
    if (showNotice) notify('loaded')
  } catch (e) {
    if (e.status === 401 || !state) {
      $('#login-panel').hidden = false;
      $('#dashboard').hidden = true;
      $('#login-msg').textContent = t(e.status === 401 ? 'loginRequired' : errorKey(e));
    } else notify(errorKey(e),
      true)
  }
}
$('#login-form').onsubmit = async ev => {
  ev.preventDefault();
  const button = ev.currentTarget.querySelector('button');
  button.disabled = true;
  try {
    await api('/api/admin/login',
      'POST', {
        token: $('#secret').value
      }
    );
    $('#secret').value = '';
    await load()
  } catch (e) {
    $('#login-msg').textContent = t(errorKey(e))
  } finally {
    button.disabled = false
  }
};
$('#logout').onclick = async () => {
  try {
    await api('/api/admin/logout',
      'POST');
    state = null;
    $('#dashboard').hidden = true;
    $('#login-panel').hidden = false;
    $('#login-msg').textContent = t('loginRequired')
  } catch (e) {
    notify(errorKey(e),
      true)
  }
};
$('#refresh').onclick = () => load(true);

function go(key) {
  active = key;
  document.querySelectorAll('[data-tab]').forEach(b => {
    b.classList.toggle('active',
      b.dataset.tab === key);
    b.setAttribute('aria-current',
      b.dataset.tab === key ? 'page' : 'false')
  });
  document.querySelectorAll('[data-section]').forEach(s => s.hidden = s.dataset.section !== key);
  $('#page-title').textContent = t(key);
  $('#admin-msg').textContent = '';
  $('#admin-msg').className = '';
}

function button(label,
  fn,
  cls = '') {
  const b = E('button',
    t(label),
    cls);
  b.type = 'button';
  b.onclick = fn;
  return b
}

function empty(target) {
  const d = E('div',
    undefined,
    'empty');
  d.append(E('span',
      '◇'),
    E('h3',
      t('empty')),
    E('p',
      t('emptyTip')));
  target.append(d)
}

function textOf(row,
  field) {
  return row[field + '_' + lang] || row[field] || row[field + '_ar'] || row[field + '_en'] || ''
}

function render() {
  const nav = $('#tabs');
  nav.replaceChildren();
  for (const [key,
      icon
    ] of tabs) {
    const b = button(key,
      () => go(key));
    b.dataset.tab = key;
    b.prepend(E('span',
      icon,
      'nav-icon'));
    nav.append(b)
  }
  const stats = $('#stats');
  stats.replaceChildren();
  [
    ['leads',
      'totalLeads',
      '✉'
    ],
    ['new',
      'newLeads',
      '↗'
    ],
    ['projects',
      'projects',
      '▦'
    ],
    ['articles',
      'articles',
      '▤'
    ]
  ].forEach(([k,
    label,
    icon
  ]) => {
    const d = E('div',
      undefined,
      'stat');
    d.append(E('i',
        icon),
      E('span',
        t(label)),
      E('strong',
        String(state.stats[k] ?? 0)));
    stats.append(d)
  });
  const sections = $('#sections');
  sections.replaceChildren();
  for (const [key] of tabs) {
    const sec = E('section');
    sec.dataset.section = key;
    sections.append(sec);
    if (key === 'overview') renderOverview(sec);
    else if (key === 'leads') renderLeads(sec);
    else if (['projects',
        'articles',
        'services'
      ].includes(key)) renderCrud(sec,
      key);
    else if (key === 'content') renderContent(sec);
    else if (key === 'knowledge') renderKnowledge(sec);
    else renderSystem(sec)
  }
  go(active)
}

function renderOverview(sec) {
  const p = E('div',
    undefined,
    'panel');
  p.append(E('span',
      'SAMI / V8',
      'eyebrow'),
    E('h2',
      t('overviewTitle')),
    E('p',
      t('overviewText'),
      'muted'));
  const actions = E('div',
    undefined,
    'actions');
  actions.append(button('openInbox',
      () => go('leads'),
      'primary'),
    button('manageProjects',
      () => go('projects')));
  p.append(actions);
  sec.append(p)
}

function renderLeads(sec) {
  const filter = E('label',
    t('filterStatus'));
  const select = E('select');
  for (const value of ['all',
      'new',
      'reviewing',
      'contacted',
      'closed'
    ]) {
    const o = E('option',
      t(value));
    o.value = value;
    select.append(o)
  }
  filter.append(select);
  sec.append(filter);
  const list = E('div',
    undefined,
    'inquiry-list');
  sec.append(list);
  const paint = () => {
    list.replaceChildren();
    const rows = state.leads.filter(l => select.value === 'all' || l.status === select.value);
    if (!rows.length) empty(list);
    for (const l of rows) {
      const card = E('details',
        undefined,
        'record');
      const summary = E('summary',
        `${l.name} · SAMI-${String(l.id).padStart(6,'0')} · ${t(l.status)}`);
      const content = E('div',
        undefined,
        'detail');
      for (const [key,
          value
        ] of [
          ['email',
            l.email
          ],
          ['contact',
            l.contact
          ],
          ['service',
            l.service
          ],
          ['deadline',
            l.deadline
          ],
          ['created',
            l.created || l.created_at
          ]
        ]) content.append(E('p',
        t(key) + ': ' + (value || t('notSet')),
        'meta'));
      content.append(E('p',
        l.details));
      const notificationKey = {
          sent: 'notificationSent',
          failed: 'notificationFailed',
          disabled: 'notificationDisabled'
        }
        [l.notification_status] || 'notificationUnknown';
      content.append(E('p',
        t('notification') + ': ' + t(notificationKey),
        'badge notification-badge'));
      if (l.attachment_url && /^\/api\/admin\//.test(l.attachment_url)) {
        const a = E('a',
          t('download'),
          'attachment');
        a.href = l.attachment_url;
        a.target = '_blank';
        a.rel = 'noopener';
        content.append(a)
      }
      const label = E('label',
        t('status'));
      const status = E('select');
      for (const v of ['new',
          'reviewing',
          'contacted',
          'closed'
        ]) {
        const o = E('option',
          t(v));
        o.value = v;
        status.append(o)
      }
      status.value = l.status;
      status.onchange = async () => {
        const old = l.status;
        status.disabled = true;
        try {
          await api('/api/admin/leads/' + l.id,
            'PATCH', {
              status: status.value
            }
          );
          l.status = status.value;
          summary.textContent = `${l.name} · SAMI-${String(l.id).padStart(6,'0')} · ${t(l.status)}`;
          notify('updatedStatus')
        } catch (e) {
          status.value = old;
          notify(errorKey(e),
            true)
        } finally {
          status.disabled = false
        }
      };
      label.append(status);
      content.append(label);
      card.append(summary,
        content);
      list.append(card)
    }
  };
  select.onchange = paint;
  paint()
}
const schemas = {
  projects: [
    ['title_ar',
      160,
      2
    ],
    ['title_en',
      160,
      0
    ],
    ['category',
      80,
      2
    ],
    ['link',
      1000,
      0
    ],
    ['summary_ar',
      800,
      5
    ],
    ['summary_en',
      800,
      0
    ],
    ['details_ar',
      6000,
      0
    ],
    ['details_en',
      6000,
      0
    ]
  ],
  articles: [
    ['title_ar',
      160,
      2
    ],
    ['title_en',
      160,
      0
    ],
    ['summary_ar',
      800,
      5
    ],
    ['summary_en',
      800,
      0
    ],
    ['body_ar',
      15000,
      10
    ],
    ['body_en',
      15000,
      0
    ]
  ],
  services: [
    ['title_ar',
      160,
      2
    ],
    ['title_en',
      160,
      0
    ],
    ['summary_ar',
      800,
      5
    ],
    ['summary_en',
      800,
      0
    ],
    ['details_ar',
      6000,
      0
    ],
    ['details_en',
      6000,
      0
    ],
    ['icon',
      40,
      0
    ]
  ]
};

function renderCrud(sec,
  kind) {
  const form = E('form',
    undefined,
    'panel editor');
  form.append(E('h2',
    t({
        projects: 'addProject',
        articles: 'addArticle',
        services: 'addService'
      }
      [kind])));
  const grid = E('div',
      undefined,
      'form-grid'),
    fields = {};
  for (const [key,
      max,
      min
    ] of schemas[kind]) {
    const label = E('label',
        t(kind === 'services' && key === 'details_ar' ? 'serviceDetailsAr' : kind === 'services' && key === 'details_en' ? 'serviceDetailsEn' : key)),
      field = E(/summary|details|body/.test(key) ? 'textarea' : 'input');
    field.maxLength = max;
    field.minLength = min;
    field.required = min > 0;
    field.name = key;
    if (key === 'link') field.type = 'url';
    field.dir = key.endsWith('_ar') ? 'rtl' : key.endsWith('_en') ? 'ltr' : 'auto';
    label.append(field);
    grid.append(label);
    fields[key] = field
  }
  form.append(grid);
  let recordId = null,
    imagePath = '',
    upload,
    preview;
  if (kind === 'projects') {
    const label = E('label',
      t('upload'),
      'full');
    upload = E('input');
    upload.type = 'file';
    upload.accept = 'image/png,image/jpeg,image/webp';
    preview = E('img',
      undefined,
      'upload-preview');
    preview.alt = t('imageAlt');
    preview.hidden = true;
    label.append(upload,
      preview,
      button('removeImage',
        () => {
          imagePath = '';
          upload.value = '';
          preview.hidden = true
        }
      ));
    grid.append(label);
    upload.onchange = () => {
      if (upload.files[0] && upload.files[0].size > 5 * 1024 * 1024) {
        upload.value = '';
        notify('sizeLimit',
          true)
      }
    }
  }
  const published = E('input');
  published.type = 'checkbox';
  published.checked = true;
  const plabel = E('label',
    t('published'),
    'check');
  plabel.prepend(published);
  const actions = E('div',
    undefined,
    'actions');
  const save = E('button',
    t('save'),
    'primary');
  save.type = 'submit';
  const reset = () => {
    recordId = null;
    form.reset();
    published.checked = true;
    imagePath = '';
    if (preview) preview.hidden = true;
  };
  actions.append(save,
    button('new',
      reset));
  form.append(E('p',
      t('draftHint'),
      'muted'),
    plabel,
    actions);
  sec.append(form);
  form.onsubmit = async ev => {
    ev.preventDefault();
    save.disabled = true;
    try {
      const data = {};
      for (const key in fields) data[key] = fields[key].value.trim();
      for (const key of ['title',
          'summary',
          'details',
          'body'
        ])
        if (fields[key + '_ar']) data[key] = data[key + '_ar'];
      data.published = published.checked;
      if (kind === 'projects') {
        if (upload.files[0]) {
          const fd = new FormData();
          fd.append('file',
            upload.files[0]);
          const r = await fetch('/api/admin/upload', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
              'X-SAMI-Admin': '1'
            },
            body: fd
          });
          if (!r.ok) {
            const e = new Error();
            e.status = r.status;
            throw e
          }
          imagePath = (await r.json()).url
        }
        data.image = imagePath
      }
      await api('/api/admin/' + kind + (recordId ? '/' + recordId : ''),
        recordId ? 'PUT' : 'POST',
        data);
      await load();
      notify('saved')
    } catch (e) {
      notify(errorKey(e),
        true)
    } finally {
      save.disabled = false
    }
  };
  const list = E('div');
  sec.append(list);
  if (!state[kind].length) empty(list);
  for (const row of state[kind]) {
    const card = E('article',
        undefined,
        'record'),
      head = E('div',
        undefined,
        'record-top');
    head.append(E('h3',
        textOf(row,
          'title')),
      E('span',
        t(row.published ? 'published' : 'draft'),
        'badge'));
    card.append(head,
      E('p',
        textOf(row,
          'summary'),
        'muted'));
    const acts = E('div',
      undefined,
      'actions');
    acts.append(button('edit',
        () => {
          recordId = row.id;
          for (const key in fields) fields[key].value = row[key] || (key.endsWith('_ar') ? row[key.slice(0,
            -3)] : '') || '';
          published.checked = !!row.published;
          if (kind === 'projects') {
            imagePath = row.image || '';
            upload.value = '';
            preview.hidden = !imagePath;
            if (imagePath && /^\/media\//.test(imagePath)) preview.src = imagePath;
            else preview.hidden = true
          }
          form.scrollIntoView({
            behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start'
          });
          fields.title_ar.focus({
            preventScroll: true
          })
        }
      ),
      button('delete',
        async () => {
            if (!confirm(t('confirmDelete'))) return;
            try {
              await api('/api/admin/' + kind + '/' + row.id,
                'DELETE');
              await load();
              notify('deleted')
            } catch (e) {
              notify(errorKey(e),
                true)
            }
          },
          'danger'));
    card.append(acts);
    list.append(card)
  }
}
const contentFields = [
  ['title_ar',
    'heroTitleAr'
  ],
  ['title_en',
    'heroTitleEn'
  ],
  ['subtitle_ar',
    'subtitleAr'
  ],
  ['subtitle_en',
    'subtitleEn'
  ],
  ['about_ar',
    'aboutAr'
  ],
  ['about_en',
    'aboutEn'
  ],
  ['site_title',
    'siteTitle'
  ],
  ['site_description_ar',
    'seoAr'
  ],
  ['site_description_en',
    'seoEn'
  ],
  ['email',
    'email'
  ],
  ['github',
    'GitHub URL'
  ],
  ['linkedin',
    'LinkedIn URL'
  ]
];

function renderContent(sec) {
  const panel = E('div',
    undefined,
    'panel');
  panel.append(E('h2',
      t('content')),
    E('p',
      t('settingsNote'),
      'muted'));
  for (const [key,
      labelText
    ] of contentFields) {
    const row = E('form',
      undefined,
      'settings-row');
    const label = E('label',
        t(labelText)),
      input = E(['email',
        'github',
        'linkedin',
        'site_title'
      ].includes(key) ? 'input' : 'textarea');
    input.maxLength = 4000;
    input.value = state.content[key] || (key.endsWith('_ar') ? state.content[key.slice(0,
      -3)] : '') || '';
    input.dir = key.endsWith('_ar') ? 'rtl' : key.endsWith('_en') || ['email',
      'github',
      'linkedin'
    ].includes(key) ? 'ltr' : 'auto';
    if (key === 'email') input.type = 'email';
    if (['github',
        'linkedin'
      ].includes(key)) input.type = 'url';
    label.append(input);
    const save = E('button',
      t('save'),
      'primary');
    save.type = 'submit';
    row.append(label,
      save);
    row.onsubmit = async ev => {
      ev.preventDefault();
      save.disabled = true;
      try {
        await api('/api/admin/content/' + key,
          'PUT', {
            value: input.value
          }
        );
        state.content[key] = input.value;
        notify('saved')
      } catch (e) {
        notify(errorKey(e),
          true)
      } finally {
        save.disabled = false
      }
    };
    panel.append(row)
  }
  sec.append(panel)
}

function renderKnowledge(sec) {
  sec.append(E('p',
    t('knowledgeNote'),
    'notice'));
  const form = E('form',
    undefined,
    'panel editor');
  form.append(E('h2',
    t('addKnowledge')));
  const title = E('input');
  title.required = true;
  title.minLength = 2;
  title.maxLength = 160;
  const body = E('textarea');
  body.required = true;
  body.minLength = 10;
  body.maxLength = 15000;
  for (const [key,
      input
    ] of [
      ['title',
        title
      ],
      ['body',
        body
      ]
    ]) {
    const label = E('label',
      t(key));
    label.append(input);
    form.append(label)
  }
  const save = E('button',
    t('save'),
    'primary');
  save.type = 'submit';
  const acts = E('div',
    undefined,
    'actions');
  acts.append(save);
  form.append(acts);
  form.onsubmit = async e => {
    e.preventDefault();
    save.disabled = true;
    try {
      await api('/api/admin/knowledge',
        'POST', {
          title: title.value,
          body: body.value
        }
      );
      await load();
      notify('saved')
    } catch (err) {
      notify(errorKey(err),
        true)
    } finally {
      save.disabled = false
    }
  };
  sec.append(form);
  if (!state.knowledge.length) empty(sec);
  for (const k of state.knowledge) {
    const card = E('article',
      undefined,
      'record');
    card.append(E('h3',
        k.title),
      E('p',
        k.body),
      button('delete',
        async () => {
            if (!confirm(t('confirmDelete'))) return;
            try {
              await api('/api/admin/knowledge/' + k.id,
                'DELETE');
              await load();
              notify('deleted')
            } catch (e) {
              notify(errorKey(e),
                true)
            }
          },
          'danger'));
    sec.append(card)
  }
}

function renderSystem(sec) {
  const grid = E('div',
    undefined,
    'system-grid');
  for (const [label,
      status
    ] of [
      ['api',
        'connected'
      ],
      ['ai',
        state.stats.ai_configured ? 'configured' : 'unconfigured'
      ]
    ]) {
    const p = E('div',
      undefined,
      'panel');
    p.append(E('span',
        t(label),
        'muted'),
      E('strong',
        t(status)));
    grid.append(p)
  }
  sec.append(grid,
    E('p',
      t('systemNote'),
      'notice'),
    E('p',
      t('webhookNote'),
      'muted'));
}
applyPreferences();
load();
