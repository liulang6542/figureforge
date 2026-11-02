/* ===== Shared i18n core (Chinese only) ===== */
(function () {
  "use strict";
  var LANG = "zh";
  var bundle = {};

  function t(key, vars) {
    var s = bundle[key] != null ? bundle[key] : key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
    return s;
  }

  function apply(root) {
    var scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.dataset.i18n);
    });
    scope.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
    scope.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      el.setAttribute("placeholder", t(el.dataset.i18nPh));
    });
    scope.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      el.setAttribute("aria-label", t(el.dataset.i18nAria));
    });
    scope.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      el.setAttribute("title", t(el.dataset.i18nTitle));
    });
  }

  document.documentElement.lang = "zh-CN";
  // 单一语言，清掉旧版本留下的语言偏好
  try { localStorage.removeItem("figgal.lang"); } catch (_) {}

  window.GAL_I18N = {
    register: function (dict) { Object.assign(bundle, (dict && dict.zh) || {}); },
    t: t,
    apply: apply,
    get lang() { return LANG; }
  };
})();
