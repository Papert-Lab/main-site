(function () {
  function renderInline(s) {
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (_, text, url) {
      var external = /^https?:\/\//.test(url) || /^mailto:/.test(url);
      var attrs = external ? ' target="_blank" rel="noopener"' : '';
      return '<a href="' + url + '"' + attrs + '>' + text + '</a>';
    });
    return s;
  }

  function mdToHtml(md) {
    var sections = md.split(/\n---\n/);
    var html = '';
    sections.forEach(function (section) {
      var lines = section.trim().split('\n');
      var isList = lines.every(function (l) { return !l.trim() || l.trim().startsWith('- '); });
      if (isList && lines.some(function (l) { return l.trim().startsWith('- '); })) {
        html += '<ul class="content-list">';
        lines.forEach(function (l) {
          l = l.trim();
          if (!l.startsWith('- ')) return;
          l = l.slice(2);
          if (l.includes('|')) {
            var parts = l.split('|').map(function (s) { return s.trim(); });
            html += '<li class="two-col"><div class="li-left">' + renderInline(parts[0]) + '</div><div class="li-right">' + renderInline(parts[1]) + '</div></li>';
          } else {
            l = renderInline(l);
            l = l.replace(/<a href="([^"]*)"[^>]*>([^<]*)<\/a>\s*"([^"]*)"/,
              '<a href="$1">$2</a><span class="date">$3</span>');
            html += '<li>' + l + '</li>';
          }
        });
        html += '</ul>';
      } else {
        var paras = section.trim().split(/\n\n+/);
        paras.forEach(function (p) {
          p = p.trim();
          if (!p) return;
          if (p.startsWith('## ')) {
            html += '<h3 class="content-subheading">' + p.slice(3) + '</h3>';
          } else {
            html += '<p>' + renderInline(p) + '</p>';
          }
        });
      }
    });
    return html;
  }

  document.querySelectorAll('.md-content[data-src]').forEach(function (el) {
    // Hide the (empty) container until its markdown arrives, then fade the real
    // content in. Hiding is JS-gated via a class — a no-JS visitor never gets the
    // .md-loading rule, so the section degrades to whatever static markup exists
    // rather than staying invisible.
    el.classList.add('md-loading');
    fetch(el.dataset.src)
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (md) { if (md) el.innerHTML = mdToHtml(md); })
      .catch(function () {})
      .then(function () {
        // Runs on success, failure, or 404 — always reveal so a section can never
        // get trapped hidden.
        el.classList.remove('md-loading');
        el.classList.add('md-loaded');
      });
  });

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });
  }
})();
