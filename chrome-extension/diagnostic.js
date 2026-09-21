// diagnostic.js v3 - Tembus ke dalam iframe
(function () {
  const old = document.getElementById('sitb-diag-panel');
  if (old) old.remove();

  const panel = document.createElement('div');
  panel.id = 'sitb-diag-panel';
  panel.style.cssText = `
    position: fixed; top: 0; right: 0; width: 400px; max-height: 100vh;
    overflow-y: auto; background: #111; color: #eee; font-family: Consolas, monospace;
    font-size: 11.5px; padding: 8px; z-index: 2147483647;
    border-left: 3px solid #00f0ff; box-shadow: -4px 0 16px rgba(0,0,0,0.7);
  `;

  const closeBtn = document.createElement('button');
  closeBtn.innerText = '✕ Tutup Panel';
  closeBtn.style.cssText = 'background:#c00;color:white;border:none;padding:5px 10px;cursor:pointer;margin-bottom:6px;font-size:12px;width:100%;';
  closeBtn.onclick = () => panel.remove();
  panel.appendChild(closeBtn);

  function sec(title, content) {
    const h = document.createElement('div');
    h.style.cssText = 'color:#00f0ff;font-weight:bold;margin-top:8px;margin-bottom:2px;border-bottom:1px solid #444;padding-bottom:2px;';
    h.innerText = title;
    panel.appendChild(h);
    const p = document.createElement('pre');
    p.style.cssText = 'margin:0;padding:5px;background:#1a1a1a;border-radius:3px;white-space:pre-wrap;word-break:break-all;color:#b5cea8;';
    p.innerText = content;
    panel.appendChild(p);
  }

  function dumpInputs(doc, titlePrefix) {
    const allInputs = Array.from(doc.querySelectorAll('input, select, textarea'));
    if (allInputs.length === 0) {
      sec(`${titlePrefix} (0 field)`, 'Tidak ada input');
      return;
    }
    const lines = allInputs.map((el, i) => {
      const name = el.name || '—';
      const id = el.id || '—';
      const type = el.type || el.tagName.toLowerCase();
      return `[${String(i+1).padStart(2)}] name="${name}" type="${type}" id="${id}"`;
    });
    sec(`${titlePrefix} (${allInputs.length} field)`, lines.join('\n'));
  }

  function dumpKendoDropdowns(doc, titlePrefix) {
    const $ = window.jQuery || window.$;
    if (!$ || !window.kendo) return;
    const kWidgets = Array.from(doc.querySelectorAll('.k-widget, select, input'));
    const widgetInfo = [];
    const seen = new Set();
    kWidgets.forEach(el => {
      const w = $(el).data('kendoDropDownList') || $(el).data('kendoComboBox');
      if (w && !seen.has(w)) {
        seen.add(w);
        const id = el.id || $(el).find('input, select').attr('id') || $(el).closest('tr').find('td:first-child').text().trim() || '—';
        const name = el.name || $(el).find('input, select').attr('name') || '—';
        const data = w.dataSource ? w.dataSource.data() : [];
        const textField = w.options?.dataTextField || 'text';
        const optionsList = data.map(d => {
          if (typeof d === 'string' || typeof d === 'number') return String(d);
          return d[textField] ?? d.text ?? d.nama ?? d.nama_pekerjaan ?? d.pekerjaan ?? d.nm_pekerjaan ?? d.uraian ?? d.deskripsi ?? d.label ?? JSON.stringify(d);
        }).slice(0, 30);
        widgetInfo.push(`📍 [${id}] (name="${name}"):\n   Pilihan (${data.length}): ${optionsList.join(' | ')}`);
      }
    });
    if (widgetInfo.length > 0) {
      sec(`${titlePrefix} (${widgetInfo.length} dropdown)`, widgetInfo.join('\n\n'));
    }
  }

  // Dump Top Document
  sec('ℹ️ TOP FRAME', `URL: ${location.href}`);
  dumpInputs(document, '📋 TOP FRAME FIELDS');
  dumpKendoDropdowns(document, '🎯 TOP FRAME DROPDOWNS');

  // Dump Iframes
  const frames = Array.from(document.querySelectorAll('iframe'));
  frames.forEach((f, i) => {
    sec(`\nℹ️ IFRAME #${i+1}`, `SRC: ${f.src || '—'}`);
    try {
      if (f.contentDocument) {
        dumpInputs(f.contentDocument, `📋 IFRAME #${i+1} FIELDS`);
        dumpKendoDropdowns(f.contentDocument, `🎯 IFRAME #${i+1} DROPDOWNS`);
      } else {
        sec(`📋 IFRAME #${i+1} FIELDS`, 'BLOCKED (Cross-Origin atau belum load)');
      }
    } catch (e) {
      sec(`📋 IFRAME #${i+1} FIELDS`, `BLOCKED (Error: ${e.message})`);
    }
  });

  document.body.appendChild(panel);
})();
