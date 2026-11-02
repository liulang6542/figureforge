/* ===== FigureForge · provider & preference store =====
   Single source of truth shared by the workbench (index.html) and the
   standalone settings page (settings.html). Both pages persist to the same
   localStorage keys, so a change made on one page is visible to the other on
   the next load. No DOM access lives here on purpose: this module is imported
   by pages with different layouts. */

/* ---------- persisted keys ---------- */
const K = {
  provider: 'ff_provider',
  key: p => 'ff_key_' + p,
  base: p => 'ff_base_' + p,
  relay: p => 'ff_relay_' + p,
  imageModel: p => 'ff_model_' + p,
  parseModel: p => 'ff_parse_model_' + p,
  parseCustom: p => 'ff_parse_cmodel_' + p,
  analyzeModel: p => 'ff_amodel_' + p,
  reconModel: p => 'ff_recon_model_' + p,
  parseEffort: 'ff_parse_reasoning_effort',
  visualEffort: 'ff_visual_reasoning_effort',
  reconEffort: p => 'ff_recon_reasoning_effort_' + p,
  roleProv: r => 'ff_r_prov_' + r,
  roleBase: r => 'ff_r_base_' + r,
  roleKey: r => 'ff_r_key_' + r,
  roleModel: r => 'ff_r_model_' + r,
  profiles: 'ff_profiles',
  target: 'ff_target',
  targetDesc: 'ff_target_desc',
  genMode: 'ff_mode'
};
export const KEYS = K;

/* ---------- per-role routing ----------
   A "role" is one job the workbench sends to a model. Each role may either
   inherit the global provider (default, keeps every existing config working)
   or carry its own provider / endpoint / key / model. Roles map 1:1 to the
   places index.html actually issues a request, so nothing has to guess. */
export const ROLES = ['parse', 'analyze', 'gen', 'image', 'recon'];
/* Weakest to strongest, matching every effort value the reasoning models expose
   (minimal and max are newer; a provider that lacks them answers 400 itself, so
   the list stays open rather than guessing per provider). */
export const EFFORTS = ['minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
export const RELAY_PRESETS = ['https://infistar.cc/v1', 'https://infistar.ai/v1'];
/* Kept so an old exported settings file still imports cleanly; nothing points at
   a built-in provider any more. */
export const PROVIDER_ORDER_HEAD = '';

/* Keys the data section may export/import. Explicit list: an unknown key in an
   imported file is ignored instead of being written blindly into storage. */
export const DATA_PREFIXES = [
  'ff_provider', 'ff_key_', 'ff_base_', 'ff_relay_', 'ff_model_', 'ff_parse_model_',
  'ff_parse_cmodel_', 'ff_amodel_', 'ff_recon_model_', 'ff_parse_reasoning_effort',
  'ff_visual_reasoning_effort', 'ff_recon_reasoning_effort_', 'ff_r_prov_',
  'ff_r_base_', 'ff_r_key_', 'ff_r_model_', 'ff_profiles', 'ff_target',
  'ff_target_desc', 'ff_mode'
];

const read = (k, d = '') => {
  try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (_) { return d; }
};
const write = (k, v) => { try { localStorage.setItem(k, v); } catch (_) { } };
const drop = k => { try { localStorage.removeItem(k); } catch (_) { } };
export const cleanKey = s => (s || '').replace(/\s+/g, '');

/* ---------- manifest ---------- */
let MAN = null;
const FALLBACK = {"updated":"2026-09-30","providers":{"ark":{"label":"火山方舟 Ark","base":"https://ark.cn-beijing.volces.com/api/v3","proto":"oai","cors":true,"chat":["doubao-seed-2-1-pro-260915","doubao-seed-2-1-lite-260915","doubao-seed-2-1-pro-260628","doubao-seed-2-1-turbo-260628","doubao-seed-evolving","doubao-seed-2-0-pro-260215","doubao-seed-2-0-lite-260428","doubao-seed-2-0-mini-260428","doubao-seed-character-260628"],"vision":["doubao-seed-2-1-pro-260915","doubao-seed-2-1-lite-260915","doubao-seed-2-1-pro-260628","doubao-seed-2-1-turbo-260628","doubao-seed-evolving","doubao-seed-2-0-pro-260215","doubao-seed-2-0-lite-260428"],"image":["doubao-seedream-5-0-pro-260628","doubao-seedream-5-0-flash-260915","doubao-seedream-5-0-260128","doubao-seedream-4-5-251128","doubao-seedream-4-0-250828"]},"sf":{"label":"硅基流动 SiliconFlow","base":"https://api.siliconflow.cn/v1","proto":"oai","cors":true,"chat":["deepseek-ai/DeepSeek-V3","Qwen/Qwen3-235B-A22B"],"vision":["Qwen/Qwen2.5-VL-72B-Instruct"],"image":["black-forest-labs/FLUX.1-schnell","Kwai-Kolors/Kolors"]},"glm":{"label":"智谱 GLM","base":"https://open.bigmodel.cn/api/paas/v4","proto":"oai","cors":true,"chat":["glm-4.5","glm-4.5-air"],"vision":["glm-4v-plus"],"image":["cogview-4"]},"ds":{"label":"DeepSeek","base":"https://api.deepseek.com","proto":"oai","cors":true,"chat":["deepseek-v4-pro","deepseek-flash"],"vision":[],"image":[]},"oai":{"label":"OpenAI","base":"https://api.openai.com/v1","proto":"oai","cors":true,"chat":["gpt-6.1-sol","gpt-6-sol","gpt-6-luna","gpt-6-astra","gpt-5.5","gpt-5.4"],"vision":["gpt-6.1-sol","gpt-6-sol","gpt-6-luna","gpt-6-astra","gpt-5.5","gpt-5.4"],"image":["gpt-image-2.5-sunburst","gpt-image-2.5-flare","gpt-image-2","gpt-image-1"]},"kimi":{"label":"Kimi 月之暗面","base":"https://api.moonshot.cn/v1","proto":"oai","cors":true,"chat":["kimi-k3","kimi-k2.6"],"vision":["kimi-k2.6"],"image":[]},"qwen":{"label":"通义千问 Qwen","base":"https://dashscope.aliyuncs.com/compatible-mode/v1","proto":"oai","cors":true,"chat":["qwen-max","qwen-plus"],"vision":["qwen-vl-max"],"image":["qwen-image"]},"hy":{"label":"腾讯混元 Hunyuan","base":"https://api.hunyuan.cloud.tencent.com/v1","proto":"oai","cors":true,"chat":["hunyuan-turbos-latest"],"vision":["hunyuan-vision"],"image":["hy-image-v3.5-preview"]},"claude":{"label":"Anthropic Claude","base":"https://api.anthropic.com","proto":"anthropic","cors":true,"chat":["claude-opus-5-5","claude-sonnet-5","claude-sonnet-4-6"],"vision":["claude-opus-5-5","claude-sonnet-5"],"image":[]},"custom":{"label":"自定义 OpenAI 兼容","base":"","proto":"oai","cors":true,"chat":[],"vision":[],"image":[]}}};

/* The built-in catalogue was retired: a fixed list of nine vendors cannot
   describe a private gateway, and it forced every unknown relay to masquerade
   as one of the nine. Providers are now user-defined only. FALLBACK survives as
   a one-shot migration table for configurations created before this change. */
export async function loadManifest() {
  MAN = { updated: '', providers: {} };
  return MAN;
}
export const manifest = () => MAN;
export const manifestUpdated = () => '';

function legacyCatalog() {
  const M = { providers: structuredClone(FALLBACK.providers) };
  M.providers.nonelinear = {
    label: '非线智能 NoneLinear',
    base: window.FF_NONELINEAR_BASE || 'https://api.nonelinear.com.cn/v1',
    proto: 'oai', cors: !!window.FF_NONELINEAR_BASE,
    chat: ['Qwen3-8B-nothink:free', 'qwen3-vl-32b-instruct'],
    vision: ['qwen3-vl-32b-instruct'], image: ['Qwen-Image']
  };
  M.providers.infistar = {
    label: 'Infistar 无限星河', base: 'https://infistar.cc/v1',
    proto: 'oai', cors: true, chat: [], vision: [], image: []
  };
  return M.providers;
}

/* ---------- channel flavour ----------
   index.html used to branch on the provider id ('ark' disables thinking,
   'infistar' streams the reconstruction, 'nonelinear' validates pixel sizes).
   Ids are now opaque, so those behaviours attach to a flavour inferred from the
   endpoint itself — the only stable clue a hand-written profile offers. */
export const FLAVORS = ['generic', 'ark', 'infistar', 'nonelinear', 'openai', 'glm', 'qwen', 'anthropic'];
export const FLAVOR_LABELS = {
  generic: '通用 OpenAI 兼容',
  ark: '火山方舟',
  infistar: 'Infistar 无限星河',
  nonelinear: '非线智能',
  openai: 'OpenAI 官方',
  glm: '智谱 GLM',
  qwen: '通义千问',
  anthropic: 'Anthropic Messages'
};
const FLAVOR_RULES = [
  [/volces\.com/i, 'ark'],
  [/infistar\.(?:cc|ai)/i, 'infistar'],
  [/nonelinear\.com\.cn/i, 'nonelinear'],
  [/api\.openai\.com/i, 'openai'],
  [/bigmodel\.cn/i, 'glm'],
  [/aliyuncs\.com|dashscope/i, 'qwen']
];
export function flavorOf(base, proto) {
  let host = '';
  try { host = new URL(String(base || '')).hostname; } catch (_) { host = String(base || ''); }
  for (const [re, f] of FLAVOR_RULES) if (re.test(host)) return f;
  return proto === 'anthropic' ? 'anthropic' : 'generic';
}
/* disableThinking: send thinking.type='disabled' on a direct call.
   responsesDoc:    PDFs go through the Responses API instead of file upload.
   imageB64:        image endpoint returns base64 rather than a URL.
   limitedImages:   one request accepts only a couple of images.
   streamRecon:     step 3 must be read as an SSE stream.
   sizeCheck:       the endpoint rejects unsupported ratio/resolution pairs.
   forceRelay:      no CORS headers, every call has to go through a relay. */
const FLAVOR_FLAGS = {
  ark: { disableThinking: true, responsesDoc: true, imageB64: true, limitedImages: true },
  openai: { responsesDoc: true },
  glm: { responsesDoc: true },
  qwen: { responsesDoc: true },
  infistar: { streamRecon: true, forceRelay: true },
  nonelinear: { streamRecon: true, sizeCheck: true }
};
export function flagsOf(meta) {
  const f = (meta && FLAVORS.includes(meta.flavor)) ? meta.flavor : flavorOf(meta && meta.base, meta && meta.proto);
  return { ...(FLAVOR_FLAGS[f] || {}) };
}

export function providerIds() {
  return readProfiles().map(p => p.id);
}
export function providerMeta(id) {
  return isProfileId(id) ? profileMeta(id) : null;
}
export function providerLabel(id) {
  const m = providerMeta(id);
  if (!m) return '';
  return m.label || id.slice(PROFILE_TAG.length);
}

/* ---------- current provider ---------- */
export function providerId() {
  const list = readProfiles();
  const saved = read(K.provider);
  if (saved && list.some(p => p.id === saved)) return saved;
  return list.length ? list[0].id : '';
}
export function setProvider(id) {
  if (!isProfileId(id) || !profileMeta(id)) return false;
  write(K.provider, id);
  return true;
}

/* ---------- user-defined provider profiles ----------
   The manifest is a closed list because it also carries the things a user cannot
   guess for an unknown relay: protocol shape, CORS behaviour and which models can
   read images. A profile stores exactly those facts, then behaves like any
   built-in provider — so roles, the global selection and every request path keep
   working without a special case for "custom". */
export const PROFILE_TAG = 'u:';
export const isProfileId = id => typeof id === 'string' && id.startsWith(PROFILE_TAG);

function readProfiles() {
  try {
    const raw = read(K.profiles);
    const list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return [];
    return list.filter(p => p && isProfileId(p.id));
  } catch (_) { return []; }
}
function writeProfiles(list) {
  write(K.profiles, JSON.stringify(list.slice(0, 40)));
}
export const profiles = () => readProfiles();

export function profileMeta(id) {
  const p = readProfiles().find(x => x.id === id);
  if (!p) return null;
  const m = p.models || {};
  const proto = p.proto === 'anthropic' ? 'anthropic' : 'oai';
  const base = String(p.base || '');
  /* An explicit flavour wins; otherwise it follows the endpoint, so moving a
     profile to another host re-attaches the right request quirks by itself. */
  const flavor = FLAVORS.includes(p.flavor) ? p.flavor : flavorOf(base, proto);
  return {
    label: p.label || '未命名服务商',
    base,
    proto,
    cors: true,
    flavor,
    flags: FLAVOR_FLAGS[flavor] || {},
    chat: Array.isArray(m.chat) ? m.chat : [],
    vision: Array.isArray(m.vision) ? m.vision : [],
    image: Array.isArray(m.image) ? m.image : [],
    profile: true
  };
}

const capList = arr => (Array.isArray(arr) ? [...new Set(arr.map(s => String(s).trim()).filter(Boolean))].slice(0, 300) : []);

export function addProfile({ label, base, proto, models, flavor } = {}) {
  const list = readProfiles();
  if (list.length >= 40) return '';
  let id = PROFILE_TAG + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  while (list.some(p => p.id === id)) id += Math.random().toString(36).slice(2, 3);
  const m = models || {};
  list.push({
    id,
    label: String(label || '').trim() || '新服务商 ' + (list.length + 1),
    base: String(base || '').trim(),
    proto: proto === 'anthropic' ? 'anthropic' : 'oai',
    ...(FLAVORS.includes(flavor) ? { flavor } : {}),
    models: { chat: capList(m.chat), vision: capList(m.vision), image: capList(m.image) }
  });
  writeProfiles(list);
  return id;
}

export function updateProfile(id, patch = {}) {
  const list = readProfiles();
  const p = list.find(x => x.id === id);
  if (!p) return false;
  if ('label' in patch) p.label = String(patch.label || '').slice(0, 60);
  if ('base' in patch) p.base = String(patch.base || '').trim().slice(0, 300);
  if ('proto' in patch) p.proto = patch.proto === 'anthropic' ? 'anthropic' : 'oai';
  /* 'auto' clears the override so the endpoint decides on every read. */
  if ('flavor' in patch) {
    if (FLAVORS.includes(patch.flavor)) p.flavor = patch.flavor;
    else delete p.flavor;
  }
  writeProfiles(list);
  return true;
}

/* ---------- legacy migration ----------
   Runs once on first load after the built-in list is gone. Every provider id
   still referenced by the global selection or by a role becomes a real profile,
   carrying its endpoint, key and model catalogue across, so nothing that worked
   before the change starts reporting "no API key". */
export function migrateLegacy() {
  const old = new Set();
  const cur = read(K.provider);
  if (cur && !isProfileId(cur)) old.add(cur);
  ROLES.forEach(r => {
    const v = read(K.roleProv(r));
    if (v && !isProfileId(v)) old.add(v);
  });
  if (!old.size) return [];

  const catalog = legacyCatalog();
  const list = readProfiles();
  const moved = [];

  for (const from of old) {
    let p = list.find(x => x.legacy === from);
    if (!p) {
      const src = catalog[from];
      if (!src) continue;
      let id = PROFILE_TAG + 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
      while (list.some(x => x.id === id)) id += Math.random().toString(36).slice(2, 3);
      p = {
        id, legacy: from,
        label: src.label || from,
        base: String(read(K.base(from)) || src.base || '').trim(),
        proto: src.proto === 'anthropic' ? 'anthropic' : 'oai',
        models: { chat: capList(src.chat), vision: capList(src.vision), image: capList(src.image) }
      };
      list.push(p);
    }
    const id = p.id;
    const key = read(K.key(from));
    if (key && !read(K.key(id))) write(K.key(id), key);
    /* Model choices were stored per provider id; carry them to the new id so the
       workbench opens on the same model the user last picked. */
    for (const suffix of ['model', 'parse_model', 'parse_cmodel', 'amodel', 'recon_model', 'recon_reasoning_effort']) {
      const v = read('ff_' + suffix + '_' + from);
      if (v && !read('ff_' + suffix + '_' + id)) write('ff_' + suffix + '_' + id, v);
    }
    if (read(K.provider) === from) write(K.provider, id);
    ROLES.forEach(r => { if (read(K.roleProv(r)) === from) write(K.roleProv(r), id); });
    if (read(K.relay(from)) === '1') write(K.relay(id), '1');
    moved.push([from, id]);
  }
  writeProfiles(list);
  return moved;
}

/* Replace one model bucket outright. Models can also be typed by hand, which is
   the only option for a gateway that does not expose /models. */
export function setProfileModelGroup(id, group, list) {
  const rows = readProfiles();
  const p = rows.find(x => x.id === id);
  if (!p || !['chat', 'vision', 'image'].includes(group)) return false;
  p.models = p.models || { chat: [], vision: [], image: [] };
  p.models[group] = capList(list);
  writeProfiles(rows);
  return true;
}

/* Deleting a profile must not leave dangling references behind: the global
   selection and every role pinned to it are reset in the same write. */
export function removeProfile(id) {
  const list = readProfiles();
  const next = list.filter(p => p.id !== id);
  if (next.length === list.length) return false;
  writeProfiles(next);
  drop(K.key(id));
  drop(K.base(id));
  drop(K.relay(id));
  ROLES.forEach(r => {
    if (read(K.roleProv(r)) === id) {
      drop(K.roleProv(r));
      drop(K.roleBase(r));
      drop(K.roleKey(r));
      drop(K.roleModel(r));
    }
  });
  if (read(K.provider) === id) {
    const rest = readProfiles();
    write(K.provider, rest.length ? rest[0].id : '');
  }
  return true;
}

/* Which global/roles currently point at this profile — shown as a badge so a
   deletion never silently breaks a working configuration. */
export function profileUsage(id) {
  const used = [];
  if (providerId() === id) used.push('global');
  ROLES.forEach(r => { if (read(K.roleProv(r)) === id) used.push(r); });
  return used;
}

/* Bucket a live /models answer into what each role can actually use. Same
   heuristics the workbench applies to unknown ids, kept here so a profile's
   stored list is already classified when a role reads it. */
const P_SKIP = /(embed|rerank|tts|speech|transcri|whisper|ocr|audio|video|seedance|t2v|i2v)/i;
const P_IMG = /(image|seedream|flux|kolors|dall-e|dall·e|gpt-image|cogview|sd-|stable-diffusion|imagen|hy-image|wanx|qwen-image|kling-v2)/i;
const P_VIS = /(vision|[^a-z]vl[^a-z]|^vl|visual|multimodal|gpt[-_]?[456]|claude|gemini|kimi|qvq|omni|internvl|llava|doubao|hunyuan)/i;
export function classifyModels(list) {
  const out = { chat: [], vision: [], image: [] };
  for (const raw of (Array.isArray(list) ? list : []).slice(0, 600)) {
    const id = String(raw || '').trim();
    if (!id || P_SKIP.test(id)) continue;
    if (P_IMG.test(id)) { if (!out.image.includes(id)) out.image.push(id); continue; }
    if (!out.chat.includes(id)) out.chat.push(id);
    if (P_VIS.test(id) && !out.vision.includes(id)) out.vision.push(id);
  }
  return out;
}

export function setProfileModels(id, buckets = {}) {
  const list = readProfiles();
  const p = list.find(x => x.id === id);
  if (!p) return false;
  const cap = arr => (Array.isArray(arr) ? [...new Set(arr.map(String))].slice(0, 300) : []);
  p.models = {
    chat: cap(buckets.chat !== undefined ? buckets.chat : (p.models || {}).chat),
    vision: cap(buckets.vision !== undefined ? buckets.vision : (p.models || {}).vision),
    image: cap(buckets.image !== undefined ? buckets.image : (p.models || {}).image)
  };
  writeProfiles(list);
  return true;
}

/* Fetch + classify + persist in one step: a profile has no built-in catalogue,
   so without this every role pinned to it would show an empty model list. */
export async function fetchProfileModels(id) {
  const meta = providerMeta(id);
  if (!meta) return { ok: false, list: [], reason: 'noprofile' };
  const key = cleanKey(read(K.key(id)));
  if (!meta.base || !key) return { ok: false, list: [], reason: 'config' };
  const res = await listModels({ base: meta.base, key, proto: meta.proto });
  if (!res.ok) return res;
  const buckets = classifyModels(res.list);
  setProfileModels(id, buckets);
  return { ok: true, list: res.list, buckets };
}

/* ---------- per-provider fields ---------- */
export const apiKey = (p = providerId()) => cleanKey(read(K.key(p)));
export const setApiKey = (v, p = providerId()) => write(K.key(p), cleanKey(v));
export const baseOverride = (p = providerId()) => read(K.base(p)).trim();
export const setBaseOverride = (v, p = providerId()) => write(K.base(p), String(v || '').trim());
export const useRelay = (p = providerId()) => isRelayForced(p) || read(K.relay(p)) === '1';
/* Only a flavour that cannot be reached from a browser forces the relay. An
   unconfigured store is not "forced" any more — that used to make the settings
   page claim a relay was active before the user had added a single provider. */
export const isRelayForced = p => {
  const m = providerMeta(p);
  if (!m) return false;
  return m.cors === false || !!(m.flags && m.flags.forceRelay);
};
export function setUseRelay(on, p = providerId()) {
  if (isRelayForced(p)) return false;  // cannot be turned off: no direct browser access
  write(K.relay(p), on ? '1' : '0');
  return true;
}
export const relayBase = () => (useRelay() ? baseOverride() : '');
export function cfg() {
  const meta = providerMeta(providerId());
  if (!meta) return { label: '', base: '', proto: 'oai', cors: true, flavor: 'generic', flags: {}, chat: [], vision: [], image: [] };
  return relayBase() ? { ...meta, proto: 'oai' } : meta;
}
export function baseURL() {
  const ov = relayBase();
  return (ov || cfg().base || '').replace(/\/+$/, '');
}

/* ---------- models ---------- */
export const imageModel = (p = providerId()) => read(K.imageModel(p));
export const setImageModel = (v, p = providerId()) => write(K.imageModel(p), v || '');
export const parseModel = (p = providerId()) => read(K.parseModel(p));
export const setParseModel = (v, p = providerId()) => write(K.parseModel(p), v || '');
export const parseCustomModel = (p = providerId()) => read(K.parseCustom(p));
export const setParseCustomModel = (v, p = providerId()) => write(K.parseCustom(p), v || '');
export const analyzeModel = (p = providerId()) => read(K.analyzeModel(p));
export const setAnalyzeModel = (v, p = providerId()) => write(K.analyzeModel(p), v || '');
export const reconModel = (p = providerId()) => read(K.reconModel(p));
/* Models a role is allowed to draw from on a given provider: an image role must
   never be offered chat models, and a text role must never be handed an image
   model. Keyed by the provider instead of the current one so a pinned role can
   ask about its own provider. */
function poolFor(role, p) {
  const m = providerMeta(p) || {};
  if (role === 'image') return m.image || [];
  if (role === 'analyze' || role === 'recon') return m.vision || [];
  return [...(m.chat || []), ...(m.vision || [])];
}
/* True when a model name appears in another provider's catalogue. Used to spot a
   role still remembering a model from the provider it was bound to before. */
function listedElsewhere(model, p) {
  return readProfiles().some(q => q.id !== p && ['chat', 'vision', 'image']
    .some(b => Array.isArray((q.models || {})[b]) && q.models[b].includes(model)));
}
/* The parser model that will actually be used: an explicit choice when it is
   still valid for this provider, otherwise the first capable model in its list.
   `p` must be the provider that will receive the request — reading the global
   one here is how a relay's model name ended up on a Qwen endpoint. */
export function effectiveParseModel(p = providerId()) {
  const meta = providerMeta(p) || {}, pool = [...(meta.chat || []), ...(meta.vision || [])];
  const saved = parseModel(p);
  const usable = saved && (!pool.length || pool.includes(saved)) ? saved : '';
  return usable || parseCustomModel(p) || (meta.chat || [])[0] || (meta.vision || [])[0] || '';
}
export const setReconModel = (v, p = providerId()) => write(K.reconModel(p), v || '');

/* ---------- per-role routing ---------- */
export const roleProvider = r => read(K.roleProv(r));
export const setRoleProvider = (r, v) => write(K.roleProv(r), v || '');
export const roleBaseOverride = r => read(K.roleBase(r)).trim();
export const setRoleBaseOverride = (r, v) => write(K.roleBase(r), String(v || '').trim());
export const roleKey = r => cleanKey(read(K.roleKey(r)));
export const setRoleKey = (r, v) => write(K.roleKey(r), cleanKey(v));
/* Explicit role model, or the legacy per-provider choice that role used before
   this layer existed — so an untouched install behaves exactly as it did. */
export function roleModel(r) {
  /* A role pinned to another provider must draw its model from that provider's
     own list. Returning '' here used to push the fallback back to the global
     provider's catalogue, so a pinned role silently sent that provider's model
     name to a different endpoint ("The product is not activated" on Qwen). */
  const pinned = roleProvider(r);
  const p = pinned || providerId();
  const explicit = read(K.roleModel(r));
  if (explicit) {
    /* Keep it unless the name is provably another provider's: listed in some
       other profile's catalogue but not in this one. Models pulled live from
       /models are in no catalogue, so a hand-picked one is never dropped. */
    const pool = poolFor(r, p);
    if (!pool.length || pool.includes(explicit) || !listedElsewhere(explicit, p)) return explicit;
  }
  if (r === 'parse') return effectiveParseModel(p);
  /* 没有显式记住的模型时退到该服务商清单的第一项：清单现在由用户自己填，
     空着不算错，但下拉里总得有个默认值。 */
  const c = pinned ? (providerMeta(pinned) || {}) : cfg();
  if (r === 'image') return imageModel(p) || (c.image || [])[0] || '';
  if (r === 'analyze') return analyzeModel(p) || (c.vision || [])[0] || '';
  if (r === 'recon') return reconModel(p) || (c.vision || [])[0] || '';
  return (c.chat || [])[0] || (c.vision || [])[0] || '';
}
export const setRoleModel = (r, v) => write(K.roleModel(r), v || '');
/* True when this role is pinned to its own provider instead of inheriting. */
export const roleIsCustom = r => !!roleProvider(r);

/* Everything a request needs, resolved per role. `inherited` tells the UI
   whether it is looking at the global config or a role override. */
export function resolveRole(role) {
  const model = roleModel(role);
  const pinned = roleProvider(role);
  if (!pinned) {
    const c = cfg();
    return {
      role, inherited: true,
      provider: providerId(), label: providerLabel(providerId()),
      base: baseURL(), key: apiKey(), relay: !!relayBase(), override: baseOverride(),
      proto: (c && c.proto) || 'oai', cfg: c, model,
      flavor: (c && c.flavor) || 'generic', flags: (c && c.flags) || {},
      cors: (providerMeta(providerId()) || {}).cors !== false
    };
  }
  const meta = providerMeta(pinned) || { label: '', base: '', proto: 'oai', flavor: 'generic', flags: {}, chat: [], vision: [], image: [] };
  const customBase = roleBaseOverride(role).replace(/\/+$/, '');
  const forced = meta.cors === false || !!(meta.flags && meta.flags.forceRelay);
  const relay = !!customBase || forced;
  const base = (customBase || String(meta.base || '')).replace(/\/+$/, '');
  const c = relay ? { ...meta, proto: 'oai' } : meta;
  return {
    role, inherited: false,
    provider: pinned, label: providerLabel(pinned),
    /* A pinned provider carries one key of its own (profiles: exactly one), so
       fall back to it before treating the role as unconfigured. */
    base, key: roleKey(role) || apiKey(pinned) || (pinned === providerId() ? apiKey() : ''),
    relay, override: customBase, proto: c.proto || 'oai', cfg: c, model,
    flavor: c.flavor || 'generic', flags: c.flags || {},
    cors: meta.cors !== false
  };
}
/* Is this role safe to send? Used by the settings page to show a warning badge
   without failing silently at generation time. */
export function roleReady(role) {
  const R = resolveRole(role);
  return !!R.base && !!R.key;
}
export function roleSummary(role) {
  const R = resolveRole(role);
  return {
    role, inherited: R.inherited, provider: R.provider, label: R.label,
    base: R.base, proto: R.proto, model: R.model,
    keyPresent: !!R.key, keyMask: maskKey(R.key), custom: !R.inherited
  };
}

/* ---------- reasoning effort ---------- */
const effortOf = (v, allowEmpty = true) =>
  (allowEmpty && v === '') || EFFORTS.includes(v) ? v : '';
export const parseEffort = () => effortOf(read(K.parseEffort));
export const setParseEffort = v => write(K.parseEffort, effortOf(v));
export const visualEffort = () => effortOf(read(K.visualEffort));
export const setVisualEffort = v => write(K.visualEffort, effortOf(v));
export const reconEffort = (p = providerId()) => effortOf(read(K.reconEffort(p)));
export const setReconEffort = (v, p = providerId()) => write(K.reconEffort(p), effortOf(v));

/* ---------- task preferences ---------- */
export const target = () => read(K.target, 'overview') || 'overview';
export const setTarget = v => write(K.target, v);
export const targetDesc = () => read(K.targetDesc);
export const setTargetDesc = v => write(K.targetDesc, v || '');
export const genMode = () => (read(K.genMode) === 'image' ? 'image' : 'svg');
export const setGenMode = v => write(K.genMode, v === 'image' ? 'image' : 'svg');

/* ---------- onboarding / settings state ---------- */
export function maskKey(key) {
  if (!key) return '';
  if (key.length <= 10) return '…' + key.slice(-2);
  return key.slice(0, 4) + '…' + key.slice(-4);
}
export function isConfigured(p = providerId()) {
  return !!apiKey(p) && !!baseURL();
}
/* One-liner used by the workbench status strip. */
export function summary() {
  const p = providerId(), meta = providerMeta(p), key = apiKey(p);
  return {
    provider: p,
    label: providerLabel(p),
    proto: (cfg() || {}).proto || 'oai',
    base: baseURL(),
    relay: useRelay(p),
    keyPresent: !!key,
    keyMask: maskKey(key),
    parseModel: effectiveParseModel(p),
    parseEffort: parseEffort(),
    imageModel: imageModel(p),
    analyzeModel: analyzeModel(p),
    reconModel: reconModel(p),
    reconEffort: reconEffort(p),
    cors: meta ? meta.cors !== false : true,
    roles: ROLES.map(roleSummary)
  };
}

/* ---------- connectivity test ----------
   Tries the cheapest real request the provider exposes:
   1. GET /models (skipped for providers that block it from browsers)
   2. a 1-token chat completion, which every chat provider must answer.
   Never throws: the caller renders the returned verdict verbatim. */
export async function testConnection({ base, key, proto, model, role } = {}) {
  if (role) {
    const R = resolveRole(role);
    base = R.base; key = R.key; proto = R.proto; model = R.model;
  }
  const started = performance.now();
  const b = String(base || baseURL() || '').replace(/\/+$/, '');
  const k = cleanKey(key != null ? key : apiKey());
  const pr = proto || cfg().proto || 'oai';
  if (!b) return { ok: false, code: 'nobase', stage: 'config', message: '未填写接口地址', ms: 0 };
  if (!k) return { ok: false, code: 'nokey', stage: 'config', message: '未填写 API Key', ms: 0 };
  const headers = pr === 'anthropic'
    ? { 'Content-Type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
    : { 'Content-Type': 'application/json', Authorization: 'Bearer ' + k };
  const withTimeout = (url, init, ms) => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    return fetch(url, { ...init, signal: c.signal }).finally(() => clearTimeout(t));
  };
  const note = (stage, message, extra = {}) =>
    ({ ok: false, code: stage, stage, message, ms: Math.round(performance.now() - started), ...extra });

  /* 1 · model list */
  try {
    const r = await withTimeout(b + (pr === 'anthropic' ? '/v1/models' : '/models'), { headers }, 12000);
    const ms = Math.round(performance.now() - started);
    if (r.ok) {
      const d = await r.json().catch(() => ({}));
      const list = (d.data || d.models || []).map(x => x.id || x.model || x.name).filter(Boolean);
      return { ok: true, code: 'ok', stage: 'models', status: r.status, ms, count: list.length, list, message: '连接正常' };
    }
    if (![401, 403, 404, 405, 501].includes(r.status)) {
      return note('models', `接口返回 HTTP ${r.status}`, { status: r.status });
    }
    if (r.status === 401 || r.status === 403) {
      return note('auth', `Key 未通过鉴权（HTTP ${r.status}）`, { status: r.status });
    }
    /* 404/405/501 → this provider simply does not expose the list; fall through */
  } catch (e) {
    const aborted = e && e.name === 'AbortError';
    return note(aborted ? 'timeout' : 'network', aborted ? '连接超时（12 秒）' : '网络不可达，可能是跨域限制或地址填错', { cors: true });
  }

  /* 2 · minimal chat completion */
  const m = model || parseModel() || (cfg().chat || [])[0] || (cfg().image || [])[0] || '';
  if (!m) return note('models', '该服务商未提供可用模型列表，请先填写模型 ID');
  try {
    const body = pr === 'anthropic'
      ? { model: m, max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] }
      : { model: m, max_tokens: 1, messages: [{ role: 'user', content: 'ping' }] };
    const url = pr === 'anthropic' ? b + '/v1/messages' : b + '/chat/completions';
    const r = await withTimeout(url, { method: 'POST', headers, body: JSON.stringify(body) }, 20000);
    const ms = Math.round(performance.now() - started);
    if (r.ok) return { ok: true, code: 'ok', stage: 'chat', status: r.status, ms, model: m, message: '连接正常（以一次最小对话请求验证）' };
    const txt = (await r.text().catch(() => '')).slice(0, 200);
    return note(r.status === 401 || r.status === 403 ? 'auth' : 'http', `HTTP ${r.status}${txt ? ' · ' + txt : ''}`, { status: r.status, model: m });
  } catch (e) {
    const aborted = e && e.name === 'AbortError';
    return note(aborted ? 'timeout' : 'network', aborted ? '对话请求超时（20 秒）' : '网络不可达，可能是跨域限制或地址填错', { cors: true, model: m });
  }
}

/* ---------- live model list (settings page only) ---------- */
export async function listModels({ base, key, proto, role } = {}) {
  if (role) {
    const R = resolveRole(role);
    base = R.base; key = R.key; proto = R.proto;
  }
  const b = String(base || baseURL() || '').replace(/\/+$/, '');
  const k = cleanKey(key != null ? key : apiKey());
  const pr = proto || cfg().proto || 'oai';
  if (!b || !k) return { ok: false, list: [], reason: 'config' };
  const headers = pr === 'anthropic'
    ? { 'x-api-key': k, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' }
    : { Authorization: 'Bearer ' + k };
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 12000);
  try {
    const r = await fetch(b + (pr === 'anthropic' ? '/v1/models' : '/models'), { headers, signal: c.signal });
    if (!r.ok) return { ok: false, list: [], reason: 'http ' + r.status };
    const d = await r.json().catch(() => ({}));
    const list = (d.data || d.models || []).map(x => x.id || x.model || x.name).filter(Boolean);
    return { ok: true, list };
  } catch (e) {
    return { ok: false, list: [], reason: e && e.name === 'AbortError' ? 'timeout' : 'network' };
  } finally { clearTimeout(t); }
}

/* ---------- data section ---------- */
export function exportAll() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (DATA_PREFIXES.some(pre => k === pre || k.startsWith(pre))) data[k] = localStorage.getItem(k);
  }
  return JSON.stringify({
    app: 'FigureForge', kind: 'settings', version: 1,
    exportedAt: new Date().toISOString(),
    provider: providerId(), settings: data
  }, null, 2);
}
/* Returns {ok, written, skipped, error}. Only whitelisted keys are written, and
   every value must be a string under 8 KB — an imported file cannot inject
   handlers or bloat storage. */
export function importAll(text) {
  let parsed;
  try { parsed = JSON.parse(String(text || '')); }
  catch (_) { return { ok: false, error: '不是合法的 JSON 文件' }; }
  const bag = parsed && parsed.settings;
  if (!bag || typeof bag !== 'object' || Array.isArray(bag)) return { ok: false, error: '文件结构不正确（缺少 settings 对象）' };
  let written = 0, skipped = 0;
  for (const [k, v] of Object.entries(bag)) {
    const allowed = DATA_PREFIXES.some(pre => k === pre || k.startsWith(pre));
    /* The profile blob is a single JSON document and legitimately exceeds the
       per-key ceiling used to stop a hostile file from bloating storage. */
    const limit = k === K.profiles ? 262144 : 8192;
    if (!allowed || typeof v !== 'string' || v.length > limit) { skipped++; continue; }
    write(k, v); written++;
  }
  /* The selection is only accepted once the matching profile is in storage —
     an imported file can no longer point at a built-in id that does not exist. */
  if (parsed.provider && profileMeta(parsed.provider)) write(K.provider, parsed.provider);
  return { ok: true, written, skipped };
}
export function clearAll() {
  const doomed = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith('ff_')) doomed.push(k);
  }
  doomed.forEach(drop);
  return doomed.length;
}
export function storageBytes() {
  let n = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || !k.startsWith('ff_')) continue;
    n += k.length + (localStorage.getItem(k) || '').length;
  }
  return n;
}
