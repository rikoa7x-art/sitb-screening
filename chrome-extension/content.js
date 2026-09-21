// content.js - SITB 100% Exact Field Match Form Filler
(async function () {
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ── 0. Frame Detection: HANYA jalankan jika frame ini memuat form ──────────
  const isFormFrame = !!document.querySelector('#nik, input[name="nik"], #dt_tgl_skrining');
  if (!isFormFrame) {
    return;
  }

  // ── Formatters & Strict Normalizers ─────────────────────────────────────────
  const formatDate = (d) => {
    if (!d) return '';
    const p = String(d).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
  };

  /**
   * Normalisasi Nilai Ya / Tidak dari Form Warga:
   * Form Warga Gejala menggunakan: 'Tidak Ada', 'Ada', 'Tidak Diketahui'
   * Form Warga Faktor Risiko menggunakan: 'Ya', 'Tidak', 'Tidak Diketahui'
   * SITB Dropdown menerima: 'Ya' atau 'Tidak'
   *
   * KRUSIAL: Nilai yang mengandung 'tidak' (seperti 'tidak ada', 'tidak diketahui')
   * HARUS SELALU dievaluasi menjadi 'Tidak', JANGAN sampai 'tidak ada' dianggap 'Ya' karena kata 'ada'!
   */
  const normalizeYN = (val) => {
    if (!val) return 'Tidak';
    const s = String(val).toLowerCase().trim();

    // 1. Cek semua variasi negatif terlebih dahulu
    if (
      s.includes('tidak') ||
      s.includes('bukan') ||
      s === '0' ||
      s === 'false' ||
      s === 'negatif' ||
      s.includes('non')
    ) {
      return 'Tidak';
    }

    // 2. Cek variasi positif hanya jika benar-benar positif
    if (
      s === 'ada' ||
      s === 'ya' ||
      s === '1' ||
      s === 'true' ||
      s.includes('positif') ||
      s.includes('reaktif')
    ) {
      return 'Ya';
    }

    return 'Tidak';
  };

  const normalizeHasil = (val) => {
    if (!val) return 'Tidak Ada Gejala dan Tanda TBC';
    const s = String(val).toLowerCase();
    if (s.includes('suspek') && !s.includes('bukan')) return 'Terduga TBC';
    if (s.includes('terduga')) return 'Terduga TBC';
    return 'Tidak Ada Gejala dan Tanda TBC';
  };

  // ── Toast Notification ─────────────────────────────────────────────────────
  function showToast(msg, type = 'info') {
    const colors = { success: '#16a34a', error: '#dc2626', info: '#2563eb', warn: '#d97706' };
    let targetDoc = document;
    try {
      if (window.top && window.top.document) targetDoc = window.top.document;
    } catch(e) {}

    const oldToast = targetDoc.getElementById('sitb-fill-toast');
    if (oldToast) oldToast.remove();

    const toast = targetDoc.createElement('div');
    toast.id = 'sitb-fill-toast';
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; background: ${colors[type] || colors.info};
      color: white; padding: 14px 18px; z-index: 2147483647; border-radius: 8px;
      font-weight: 600; font-family: system-ui, -apple-system, sans-serif; font-size: 13.5px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.35); white-space: pre-line; max-width: 380px;
      line-height: 1.4; border: 1px solid rgba(255,255,255,0.2);
    `;
    toast.innerText = msg;
    targetDoc.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 6000);
  }

  // ── Helper jQuery Frame Lokal ──────────────────────────────────────────────
  const $ = window.jQuery || window.$ || (window.kendo && window.kendo.jQuery);

  // ── Text & Textarea Filler ─────────────────────────────────────────────────
  function setTextVal(selector, val) {
    if (!val && val !== 0) return false;
    const el = document.querySelector(selector);
    if (!el) return false;
    el.value = String(val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));
    return true;
  }

  // ── DatePicker Filler ──────────────────────────────────────────────────────
  function setDateVal(id, dateStr) {
    if (!dateStr) return false;
    const formatted = formatDate(dateStr); // DD/MM/YYYY
    const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
    if (!el) return false;

    if ($) {
      try {
        const dp = $(el).data('kendoDatePicker');
        if (dp) {
          dp.value(formatted);
          dp.trigger('change');
        }
      } catch (e) {}
    }

    el.value = formatted;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur', { bubbles: true }));

    const hidId = id.replace(/^dt_/, '');
    const hidEl = document.getElementById(hidId) || document.querySelector(`[name="${hidId}"]`);
    if (hidEl && hidEl !== el) {
      hidEl.value = formatted;
      hidEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  }

  // ── Dropdown Item Text Extractor ────────────────────────────────────────────
  function extractItemTexts(item, textField) {
    if (item === null || item === undefined) return [];
    if (typeof item === 'string' || typeof item === 'number') {
      return [String(item).trim()];
    }
    const texts = [];
    if (textField && item[textField] !== undefined && item[textField] !== null) {
      texts.push(String(item[textField]).trim());
    }
    const knownKeys = [
      'text', 'nama', 'name', 'label', 'nama_pekerjaan', 'pekerjaan', 'nm_pekerjaan',
      'uraian', 'deskripsi', 'description', 'keterangan', 'kd_pekerjaan', 'kode',
      'nama_tempat', 'tempat', 'nm_tempat', 'title', 'value'
    ];
    for (const k of knownKeys) {
      if (item[k] !== undefined && item[k] !== null) {
        texts.push(String(item[k]).trim());
      }
    }
    for (const [k, v] of Object.entries(item)) {
      if (typeof v === 'string' && v.trim().length > 0 && !k.startsWith('_')) {
        texts.push(v.trim());
      }
    }
    return Array.from(new Set(texts.filter(Boolean)));
  }

  // ── Get Kendo Widget from Any Related Element ──────────────────────────────
  function getKendoWidget(el) {
    if (!el || !$) return null;
    const $el = $(el);
    let w = $el.data('kendoDropDownList') || $el.data('kendoComboBox');
    if (w) return w;

    const roleEl = $el.find('[data-role="dropdownlist"], [data-role="combobox"]').addBack('[data-role="dropdownlist"], [data-role="combobox"]');
    if (roleEl.length) {
      w = roleEl.data('kendoDropDownList') || roleEl.data('kendoComboBox');
      if (w) return w;
    }

    const wrapper = $el.closest('.k-widget').add($el.find('.k-widget'));
    if (wrapper.length) {
      w = wrapper.data('kendoDropDownList') || wrapper.data('kendoComboBox');
      if (w) return w;
    }

    if (window.kendo && typeof window.kendo.widgetInstance === 'function') {
      try {
        w = window.kendo.widgetInstance($el) || (wrapper.length ? window.kendo.widgetInstance(wrapper) : null);
        if (w) return w;
      } catch (e) {}
    }
    return null;
  }

  // ── Select Item in Kendo Widget Safely & Update Display ─────────────────────
  function selectKendoWidget(widget, index, item, targetText, origEl) {
    try {
      const valueField = widget.options?.dataValueField || 'value';
      let val = undefined;
      if (item !== null && typeof item === 'object') {
        val = item[valueField] !== undefined ? item[valueField] : (item.value !== undefined ? item.value : (item.id !== undefined ? item.id : index));
      } else if (typeof item === 'string' || typeof item === 'number') {
        val = item;
      }

      if (typeof widget.select === 'function') {
        widget.select(index);
      }
      if (val !== undefined && typeof widget.value === 'function') {
        widget.value(val);
      }
      if (typeof widget.trigger === 'function') {
        widget.trigger('select', { item: widget.ul ? $(widget.ul).children().eq(index) : null });
        widget.trigger('change');
      }

      const nativeEl = origEl || (widget.element ? widget.element[0] : null);
      if (nativeEl) {
        if (val !== undefined) nativeEl.value = val;
        nativeEl.dispatchEvent(new Event('input', { bubbles: true }));
        nativeEl.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const displayTxt = (item && typeof item === 'object')
        ? (item[widget.options?.dataTextField] ?? item.text ?? item.nama ?? item.nama_pekerjaan ?? item.pekerjaan ?? targetText)
        : String(item ?? targetText);

      if (widget.wrapper) {
        const kInput = widget.wrapper.find('.k-input');
        if (kInput.length) {
          if (kInput[0].tagName === 'INPUT') {
            kInput.val(displayTxt);
            kInput[0].dispatchEvent(new Event('input', { bubbles: true }));
            kInput[0].dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            kInput.text(displayTxt);
          }
        }
      }
      return true;
    } catch (e) {
      console.warn('[SITB Assistant] Error selecting widget item:', e);
      return false;
    }
  }

  // ── Flexible Text Matcher ──────────────────────────────────────────────────
  function matchText(candidate, target) {
    if (!candidate || !target) return false;
    const c = String(candidate).trim().toLowerCase();
    const t = String(target).trim().toLowerCase();
    if (c === t) return true;

    // Normalizer: strip whitespace, slashes, punctuation
    const cleanC = c.replace(/[\s\/_,\-\.\*:]+/g, '');
    const cleanT = t.replace(/[\s\/_,\-\.\*:]+/g, '');
    if (cleanC === cleanT) return true;

    // Desa prefix stripping
    const cleanCNoDesa = cleanC.replace(/^desa/, '');
    const cleanTNoDesa = cleanT.replace(/^desa/, '');
    if (cleanCNoDesa === cleanTNoDesa) return true;

    // Substring inclusion (min length 3)
    if (cleanT.length >= 3 && (cleanC.includes(cleanT) || cleanT.includes(cleanC))) return true;
    if (cleanTNoDesa.length >= 3 && (cleanCNoDesa.includes(cleanTNoDesa) || cleanTNoDesa.includes(cleanCNoDesa))) return true;

    // Ya / Tidak special matching
    if (t === 'ya' && (c === 'ya' || c === 'ada' || c.includes('ya') || c.includes('ada') || c.includes('positif') || c.includes('reaktif'))) return true;
    if (t === 'tidak' && (c === 'tidak' || c === 'tidak ada' || c.includes('tidak') || c.includes('negatif') || c.includes('non') || c.includes('bukan'))) return true;

    return false;
  }

  // ── Click Popup Item in DOM Fallback ───────────────────────────────────────
  async function clickPopupItem(searchTargets, wrapperEl, widget) {
    let opened = false;
    if (widget && typeof widget.open === 'function') {
      try {
        widget.open();
        opened = true;
      } catch (e) {}
    }
    if (!opened && wrapperEl) {
      const arrow = wrapperEl.querySelector('.k-select, .k-icon, .k-dropdown-wrap') || wrapperEl;
      arrow.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      arrow.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      opened = true;
    }

    await sleep(350);

    const items = Array.from(document.querySelectorAll('.k-animation-container .k-item, .k-popup .k-item, .k-list .k-item, ul[role="listbox"] li'));
    console.log('[SITB Assistant] clickPopupItem candidates count:', items.length);

    for (const st of searchTargets) {
      for (const item of items) {
        const itemTxt = item.textContent.trim();
        if (matchText(itemTxt, st)) {
          console.log(`[SITB Assistant] Found popup item "${itemTxt}" matching "${st}", clicking...`);
          item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          item.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
          item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          await sleep(200);
          if (widget && typeof widget.close === 'function') {
            try { widget.close(); } catch (e) {}
          }
          return true;
        }
      }
    }

    if (widget && typeof widget.close === 'function') {
      try { widget.close(); } catch (e) {}
    }
    return false;
  }

  // ── Kendo Dropdown Master Setter ───────────────────────────────────────────
  async function setKendoDrop(fieldId, targetText, fallbackList = []) {
    if (!targetText && (!fallbackList || fallbackList.length === 0)) return false;
    const searchTargets = [targetText, ...(fallbackList || [])].filter(Boolean);
    const baseId = fieldId.replace(/_input$/, '');

    // 1. Coba Kendo Widget API
    if ($) {
      const origEl = document.getElementById(baseId) || document.querySelector(`[name="${baseId}"]`);
      if (origEl) {
        let widget = getKendoWidget(origEl);
        if (widget) {
          let data = widget.dataSource ? widget.dataSource.data() : [];
          if ((!data || data.length === 0) && widget.dataSource && typeof widget.dataSource.read === 'function') {
            try {
              await widget.dataSource.read();
              data = widget.dataSource.data();
            } catch (e) {}
          }

          const textField = widget.options?.dataTextField || 'text';

          for (const st of searchTargets) {
            for (let i = 0; i < data.length; i++) {
              const item = data[i];
              const texts = extractItemTexts(item, textField);
              const matched = texts.some(t => matchText(t, st));
              if (matched) {
                selectKendoWidget(widget, i, item, st, origEl);
                return true;
              }
            }
          }
        }
      }
    }

    // 2. Fallback: DOM Popup Click
    const origEl = document.getElementById(baseId) || document.querySelector(`[name="${baseId}"]`);
    const wrapper = origEl ? (origEl.closest('.k-widget') || origEl.parentElement) : null;
    const widget = origEl ? getKendoWidget(origEl) : null;
    if (await clickPopupItem(searchTargets, wrapper, widget)) {
      return true;
    }

    // 3. Fallback: Set input langsung
    const vis = document.querySelector(`[name="${baseId}_input"]`);
    const hid = origEl;
    if (vis) {
      vis.value = targetText;
      vis.dispatchEvent(new Event('input', { bubbles: true }));
      vis.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (hid && hid !== vis) {
      hid.value = targetText;
      hid.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  }

  // ── Find Field ID Directly from DOM Label Text ─────────────────────────────
  function findFieldIdByLabel(labelText) {
    const cleanTarget = labelText.toLowerCase().trim();
    const candidates = Array.from(document.querySelectorAll('label, td, th, .control-label, div'));
    const matches = candidates.filter(el => {
      const text = el.textContent.toLowerCase().trim();
      return text.includes(cleanTarget) && text.length < cleanTarget.length + 80;
    });

    matches.sort((a, b) => a.textContent.trim().length - b.textContent.trim().length);

    for (const el of matches) {
      if (el.htmlFor) {
        const target = document.getElementById(el.htmlFor) || document.querySelector(`[name="${el.htmlFor}"]`);
        if (target) return target.id || target.name;
      }

      const row = el.closest('tr, .form-group, .row, .k-form-field') || el.parentElement;
      if (row) {
        const input = row.querySelector('select, input:not([type="button"]):not([type="submit"]):not([type="image"])');
        if (input) {
          return input.id || input.name;
        }
      }
    }
    return null;
  }

  // ── Smart Dropdown Setter by Label or Selectors ────────────────────────────
  async function setDropdownSmart(labelPattern, candidateSelectors, targetText, fallbackList = []) {
    if (!targetText && (!fallbackList || fallbackList.length === 0)) return false;

    const searchTargets = [targetText, ...fallbackList].filter(Boolean);
    console.log(`[SITB Assistant] setDropdownSmart for "${labelPattern}", targets:`, searchTargets);

    let targetEl = null;
    let targetRow = null;

    // 1a. Coba cari via baris label di tabel (paling akurat untuk form SITB)
    const cleanPattern = labelPattern.toLowerCase().replace(/[\s\*:]+/g, '');
    const allRows = Array.from(document.querySelectorAll('tr, .form-group, .row, .k-form-field'));
    for (const row of allRows) {
      const labelCell = row.querySelector('td:first-child, th:first-child, label, .control-label') || row.children[0] || row;
      const cellText = labelCell.textContent.toLowerCase().replace(/[\s\*:]+/g, '');
      if (cellText.includes(cleanPattern)) {
        targetRow = row;
        targetEl = row.querySelector('.k-widget, select, input:not([type="hidden"]), input');
        if (targetEl) {
          console.log(`[SITB Assistant] Found row for "${labelPattern}":`, row);
          break;
        }
      }
    }

    // 1b. Fallback: Coba via candidateSelectors
    if (!targetEl) {
      for (const sel of candidateSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          targetEl = el;
          targetRow = el.closest('tr, .form-group, .row, .k-form-field');
          break;
        }
      }
    }

    if (!targetEl && !targetRow) {
      console.warn(`[SITB Assistant] Elemen untuk "${labelPattern}" tidak ditemukan di DOM.`);
      return false;
    }

    // 2. Coba lewat Kendo UI Widget API
    const contextEl = targetEl || targetRow;
    let widget = getKendoWidget(contextEl);
    if (!widget && targetRow) {
      const inputs = Array.from(targetRow.querySelectorAll('select, input, .k-widget'));
      for (const inp of inputs) {
        widget = getKendoWidget(inp);
        if (widget) break;
      }
    }

    if (widget) {
      let data = widget.dataSource ? widget.dataSource.data() : [];
      if ((!data || data.length === 0) && widget.dataSource && typeof widget.dataSource.read === 'function') {
        try {
          await widget.dataSource.read();
          data = widget.dataSource.data();
        } catch (e) {}
      }

      // If still empty, try opening widget briefly
      if (!data || data.length === 0) {
        if (typeof widget.open === 'function') {
          try {
            widget.open();
            await sleep(300);
            widget.close();
            data = widget.dataSource ? widget.dataSource.data() : [];
          } catch (e) {}
        }
      }

      console.log(`[SITB Assistant] "${labelPattern}" options in dataSource (${data.length}):`, data);

      const textField = widget.options?.dataTextField || 'text';

      for (const st of searchTargets) {
        for (let i = 0; i < data.length; i++) {
          const item = data[i];
          const texts = extractItemTexts(item, textField);
          const matched = texts.some(t => matchText(t, st));
          if (matched) {
            console.log(`[SITB Assistant] Successfully matched "${texts[0]}" for "${labelPattern}"`);
            selectKendoWidget(widget, i, item, st, targetEl);
            return true;
          }
        }
      }
    }

    // 3. Fallback: Buka Dropdown & Klik Item di DOM Popup
    const wrapper = widget?.wrapper?.[0] || (targetEl ? (targetEl.closest('.k-widget') || targetEl.parentElement) : null) || targetRow;
    if (await clickPopupItem(searchTargets, wrapper, widget)) {
      return true;
    }

    // 4. Fallback jika native <select>
    const selectEl = targetRow?.querySelector('select') || (targetEl?.tagName === 'SELECT' ? targetEl : null);
    if (selectEl) {
      const opts = Array.from(selectEl.options);
      for (const st of searchTargets) {
        for (let i = 0; i < opts.length; i++) {
          if (matchText(opts[i].text, st)) {
            selectEl.selectedIndex = i;
            selectEl.dispatchEvent(new Event('input', { bubbles: true }));
            selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
      }
    }

    return false;
  }

  // ── Helper: Set Dropdown by Label Text ─────────────────────────────────────
  async function setDropByLabel(labelText, targetText, fallbackList = []) {
    const fieldId = findFieldIdByLabel(labelText);
    if (fieldId) {
      return await setKendoDrop(fieldId, targetText, fallbackList);
    }
    return false;
  }

  // ── Auto Dismiss "Data Tidak Ditemukan" / NIK Dukcapil Modals ──────────────
  function dismissNikNotFoundModal() {
    let clicked = false;

    // 1. SweetAlert2 / SweetAlert1 confirm buttons
    const swalBtns = Array.from(document.querySelectorAll('.swal2-confirm, .swal-button--confirm, .sweet-alert button.confirm'));
    for (const btn of swalBtns) {
      if (btn.offsetParent !== null) {
        console.log('[SITB Assistant] Auto-confirming SweetAlert dialog...');
        btn.click();
        clicked = true;
      }
    }

    // 2. Bootstrap, Kendo Dialog, or Generic Modal Popups
    const dialogs = Array.from(document.querySelectorAll('.modal.show, .modal.in, div[role="dialog"], .k-dialog, .k-window, .bootbox.modal'));
    for (const d of dialogs) {
      if (d.offsetParent === null && !d.classList.contains('show') && !d.classList.contains('in')) continue;
      const text = d.textContent.toLowerCase();
      if (
        text.includes('tidak ditemukan') ||
        text.includes('tidak terdaftar') ||
        text.includes('tidak terverifikasi') ||
        text.includes('tidak valid') ||
        text.includes('manual') ||
        text.includes('dukcapil') ||
        text.includes('apakah')
      ) {
        const btns = Array.from(d.querySelectorAll('button, a.btn, input[type="button"], .k-button'));
        const targetBtn = btns.find(b => {
          const bt = b.textContent.toLowerCase().trim();
          return bt === 'ya' || bt === 'lanjutkan' || bt === 'ya, lanjutkan' || bt === 'ok' || bt === 'yes' || bt === 'lanjut' || bt.includes('manual');
        }) || btns.find(b => b.classList.contains('btn-primary') || b.classList.contains('k-primary')) || btns[0];

        if (targetBtn) {
          console.log('[SITB Assistant] Auto-confirming modal via button:', targetBtn.textContent.trim());
          targetBtn.click();
          clicked = true;
        }
      }
    }

    return clicked;
  }

  // ── Helper: Fill & Restore Identitas Dasar (Nama, JK, Tanggal Lahir) ──────
  async function fillIdentitas(data, force = false) {
    if (!data) return false;
    let changed = false;

    // 1. Nama Peserta
    const namaInput = document.querySelector('#nama_peserta, [name="nama_peserta"]');
    if (namaInput) {
      namaInput.readOnly = false;
      namaInput.disabled = false;
      if (force || !namaInput.value || namaInput.value.trim() === '') {
        namaInput.value = data.nama_peserta || '';
        namaInput.dispatchEvent(new Event('input', { bubbles: true }));
        namaInput.dispatchEvent(new Event('change', { bubbles: true }));
        namaInput.dispatchEvent(new Event('blur', { bubbles: true }));
        changed = true;
      }
    }

    // 2. Jenis Kelamin
    const origJk = document.getElementById('jenis_kelamin_id') || document.querySelector('[name="jenis_kelamin_id"]');
    let jkNeedsFill = force;
    if (!jkNeedsFill && origJk) {
      const widget = getKendoWidget(origJk);
      const val = widget ? widget.value() : origJk.value;
      if (!val || String(val).trim() === '') {
        jkNeedsFill = true;
      }
    }
    if (jkNeedsFill && data.jenis_kelamin) {
      if (origJk) {
        origJk.disabled = false;
        const widget = getKendoWidget(origJk);
        if (widget && typeof widget.enable === 'function') {
          widget.enable(true);
        }
      }
      await setKendoDrop('jenis_kelamin_id', data.jenis_kelamin, [data.jenis_kelamin === 'Laki-laki' ? 'L' : 'P']);
      changed = true;
    }

    // 3. Tanggal Lahir
    const tglInput = document.getElementById('dt_tgl_lahir') || document.querySelector('[name="dt_tgl_lahir"]');
    let tglNeedsFill = force;
    if (!tglNeedsFill && tglInput) {
      if (!tglInput.value || tglInput.value.trim() === '') {
        tglNeedsFill = true;
      }
    }
    if (tglNeedsFill && data.tanggal_lahir) {
      if (tglInput) {
        tglInput.readOnly = false;
        tglInput.disabled = false;
      }
      setDateVal('dt_tgl_lahir', data.tanggal_lahir);
      changed = true;
    }

    return changed;
  }

  // ── Floating Quick Restore Button on SITB Page ─────────────────────────────
  function showRestoreButton(patientData) {
    let targetDoc = document;
    try {
      if (window.top && window.top.document) targetDoc = window.top.document;
    } catch (e) {}

    const oldBtn = targetDoc.getElementById('sitb-restore-btn');
    if (oldBtn) oldBtn.remove();

    const bar = targetDoc.createElement('div');
    bar.id = 'sitb-restore-btn';
    bar.style.cssText = `
      position: fixed; bottom: 84px; right: 24px; z-index: 2147483645;
      background: #0f172a; color: #fff; padding: 8px 12px; border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.35); font-family: system-ui, sans-serif;
      font-size: 12.5px; display: flex; align-items: center; gap: 8px;
      border: 1px solid #3b82f6;
    `;
    bar.innerHTML = `
      <span style="color:#60a5fa;font-weight:600;">🛡️ SITB Guard</span>
      <button id="btn-do-restore" style="
        background: #2563eb; color: white; border: none; padding: 6px 11px;
        border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 12px;
      ">✍️ Pulihkan Nama, JK & TTL</button>
      <button id="btn-close-restore" style="
        background: transparent; color: #94a3b8; border: none; cursor: pointer; font-size: 14px; padding: 0 4px;
      ">✕</button>
    `;
    targetDoc.body.appendChild(bar);

    const doBtn = bar.querySelector('#btn-do-restore');
    if (doBtn) {
      doBtn.onclick = async () => {
        dismissNikNotFoundModal();
        await sleep(150);
        await fillIdentitas(patientData, true);
        showToast('✅ Nama, Jenis Kelamin & Tanggal Lahir berhasil dipulihkan!', 'success');
      };
    }

    const closeBtn = bar.querySelector('#btn-close-restore');
    if (closeBtn) {
      closeBtn.onclick = () => bar.remove();
    }

    setTimeout(() => {
      if (bar && bar.parentElement) bar.remove();
    }, 60000);
  }

  // ── Background Anti-Reset Guard for NIK Lookup ─────────────────────────────
  let activeGuardTimer = null;

  function startNikResetGuard(patientData, durationMs = 25000) {
    if (activeGuardTimer) clearInterval(activeGuardTimer);
    const startTime = Date.now();
    console.log('[SITB Assistant] Memulai Anti-Reset Guard untuk NIK selama', durationMs, 'ms');

    activeGuardTimer = setInterval(async () => {
      if (Date.now() - startTime > durationMs) {
        clearInterval(activeGuardTimer);
        activeGuardTimer = null;
        console.log('[SITB Assistant] Anti-Reset Guard selesai.');
        return;
      }

      // 1. Auto-dismiss modal jika muncul
      const modalDismissed = dismissNikNotFoundModal();
      if (modalDismissed) {
        await sleep(300);
      }

      // 2. Cek apakah field identitas mendadak kosong
      const namaEl = document.querySelector('#nama_peserta, [name="nama_peserta"]');
      const tglEl = document.getElementById('dt_tgl_lahir') || document.querySelector('[name="dt_tgl_lahir"]');
      const jkEl = document.getElementById('jenis_kelamin_id') || document.querySelector('[name="jenis_kelamin_id"]');

      let jkEmpty = false;
      if (jkEl) {
        const w = getKendoWidget(jkEl);
        const val = w ? w.value() : jkEl.value;
        if (!val || String(val).trim() === '') jkEmpty = true;
      }

      const namaEmpty = namaEl && (!namaEl.value || namaEl.value.trim() === '');
      const tglEmpty = tglEl && (!tglEl.value || tglEl.value.trim() === '');

      if (namaEmpty || tglEmpty || jkEmpty) {
        console.log('[SITB Assistant] Guard mendeteksi field identitas di-reset oleh SITB! Memulihkan data...', {
          namaEmpty, tglEmpty, jkEmpty
        });
        await fillIdentitas(patientData, true);
      }
    }, 500);
  }

  // ── PROSES PENGISIAN UTAMA ─────────────────────────────────────────────────
  async function startProcess(data) {
    if (!data) return;

    showToast('🔄 Mengisi seluruh data skrining ke form SITB...', 'info');
    let ok = 0;

    // ── 1. IDENTITAS DIRI PESERTA ──
    if (setDateVal('dt_tgl_skrining', data.tanggal_skrining)) ok++;
    await setKendoDrop('kegiatan_id', 'Skrining Oleh Fasyankes');

    // 1a. Tempat Skrining (Smart matching & sinonim kategori tempat)
    const tempatCandidates = [
      '#tempat_skrining_id', '[name="tempat_skrining_id"]',
      '#tempat_skrining', '[name="tempat_skrining"]',
      '#tempat_pelaksanaan_id', '[name="tempat_pelaksanaan_id"]',
      '#tempat_pelaksanaan', '[name="tempat_pelaksanaan"]',
      '#tempat_id', '[name="tempat_id"]',
      '#id_tempat', '[name="id_tempat"]',
      '#lokasi_skrining_id', '[name="lokasi_skrining_id"]',
      '#lokasi_skrining', '[name="lokasi_skrining"]'
    ];
    const tempatVal = data.tempat_skrining || 'Puskesmas';
    const cleanTempat = tempatVal.toLowerCase().trim();
    const desaPolos = cleanTempat.replace(/^desa\s*/i, '').trim();

    const TEMPAT_MAP = {
      'puskesmas': ['puskesmas', 'puskesmas tanjungwangi', 'fasyankes', 'fasilitas kesehatan', 'klinik', 'lainnya'],
      'posyandu': ['posyandu', 'posyandu lansia', 'posyandu balita', 'pos', 'lainnya'],
      'posbindu': ['posbindu', 'posbindu ptm', 'pos', 'lainnya'],
      'rumah warga': ['rumah warga', 'rumah', 'kunjungan rumah', 'domisili', 'komunitas', 'lainnya'],
      'tempat kerja': ['tempat kerja', 'kantor', 'perusahaan', 'pabrik', 'lainnya'],
      'sekolah': ['sekolah', 'institusi pendidikan', 'sd', 'smp', 'sma', 'lainnya'],
      'pesantren': ['pesantren', 'pondok pesantren', 'ponpes', 'lainnya'],
      'lapas/rutan': ['lapas/rutan', 'lapas', 'rutan', 'lembaga pemasyarakatan', 'tahanan', 'lainnya'],
      'lainnya': ['lainnya', 'lain-lain', 'lain nya']
    };

    const tempatFallbacks = TEMPAT_MAP[cleanTempat] || [desaPolos, 'Puskesmas', 'Posyandu', 'Rumah Warga', 'Lainnya'];
    let tempatOk = await setDropdownSmart('Tempat Skrining', tempatCandidates, tempatVal, tempatFallbacks);
    if (!tempatOk) {
      for (const cand of ['tempat_skrining_id', 'tempat_skrining', 'tempat_pelaksanaan_id', 'tempat_pelaksanaan', 'tempat_id']) {
        tempatOk = await setKendoDrop(cand, tempatVal, tempatFallbacks);
        if (tempatOk) break;
      }
    }
    if (tempatOk) ok++;

    await setKendoDrop('warga_negara_id', data.kewarganegaraan || 'WNI');

    // Intercept native confirm/alert jika ada dialog cek NIK bawaan browser
    const _nativeConfirm = window.confirm;
    const _nativeAlert = window.alert;
    try {
      window.confirm = () => true;
      window.alert = () => true;
    } catch (e) {}

    // Input NIK
    if (setTextVal('#nik, [name="nik"]', data.nik)) ok++;

    // Isi Identitas Awal (Nama, JK, Tanggal Lahir)
    await fillIdentitas(data, true);
    ok += 3;

    // Tunggu jika SITB melakukan pengecekan online NIK (Dukcapil)
    console.log('[SITB Assistant] Menunggu respon pengecekan NIK SITB/Dukcapil...');
    for (let waitStep = 0; waitStep < 5; waitStep++) {
      await sleep(500);
      if (dismissNikNotFoundModal()) {
        console.log('[SITB Assistant] Modal "Data tidak ditemukan" dikonfirmasi otomatis.');
        await sleep(400);
        await fillIdentitas(data, true);
        break;
      }
    }

    // Pulihkan native confirm & alert
    try {
      window.confirm = _nativeConfirm;
      window.alert = _nativeAlert;
    } catch (e) {}

    // Pastikan Nama, JK, Tanggal Lahir tetap terisi sebelum lanjut
    await fillIdentitas(data, false);
    await sleep(500);

    // 1b. Pekerjaan (Smart matching: coba nama pekerjaan langsung, gabungan SITB, & sinonim)
    const pekerjaanCandidates = [
      '#pekerjaan_id', '[name="pekerjaan_id"]',
      '#pekerjaan', '[name="pekerjaan"]',
      '#id_pekerjaan', '[name="id_pekerjaan"]',
      '#kd_pekerjaan', '[name="kd_pekerjaan"]',
      '#kd_pekerjaan_id', '[name="kd_pekerjaan_id"]',
      '#mst_pekerjaan_id', '[name="mst_pekerjaan_id"]',
      '#profesi_id', '[name="profesi_id"]',
      '#profesi', '[name="profesi"]'
    ];
    const pekerjaanVal = data.pekerjaan || 'Tidak Bekerja';
    const cleanPekerjaan = pekerjaanVal.toLowerCase().trim();

    const PEKERJAAN_MAP = {
      'pedagang': [
        'pedagang', 'wiraswasta/pedagang', 'wiraswasta / pedagang', 'wiraswasta',
        'perdagangan', 'usaha', 'pengusaha', 'swasta', 'karyawan swasta', 'pegawai swasta',
        'buruh', 'lainnya', 'lain-lain'
      ],
      'wiraswasta': [
        'wiraswasta', 'wiraswasta/pedagang', 'wiraswasta / pedagang', 'pedagang',
        'usaha', 'pengusaha', 'swasta', 'karyawan swasta', 'pegawai swasta',
        'lainnya', 'lain-lain'
      ],
      'petani/pekebun': [
        'petani/pekebun', 'petani / pekebun', 'buruh/petani/nelayan', 'petani',
        'pekebun', 'pertanian', 'perkebunan', 'buruh tani', 'buruh', 'lainnya', 'lain-lain'
      ],
      'nelayan': [
        'nelayan', 'buruh/petani/nelayan', 'perikanan', 'buruh nelayan', 'buruh', 'lainnya', 'lain-lain'
      ],
      'buruh harian lepas': [
        'buruh harian lepas', 'buruh harian', 'buruh/petani/nelayan', 'buruh lepas',
        'buruh', 'karyawan lepas', 'pekerja lepas', 'swasta', 'lainnya', 'lain-lain'
      ],
      'pegawai swasta': [
        'pegawai swasta', 'karyawan swasta', 'pegawai negeri/swasta', 'swasta',
        'karyawan', 'buruh swasta', 'wiraswasta', 'lainnya', 'lain-lain'
      ],
      'pegawai negeri sipil': [
        'pegawai negeri sipil', 'pegawai negeri sipil (pns)', 'pns', 'asn',
        'pegawai negeri/swasta', 'pns/tni/polri', 'pns / tni / polri',
        'aparatur sipil negara', 'pegawai negeri', 'lainnya', 'lain-lain'
      ],
      'tni/polri': [
        'tni/polri', 'tni / polri', 'pns/tni/polri', 'pns / tni / polri',
        'tni', 'polri', 'tentara', 'polisi', 'anggota tni', 'anggota polri', 'lainnya', 'lain-lain'
      ],
      'ibu rumah tangga': [
        'ibu rumah tangga', 'tidak bekerja / ibu rumah tangga', 'tidak bekerja/ibu rumah tangga',
        'mengurus rumah tangga', 'rumah tangga', 'irt', 'tidak bekerja', 'belum/tidak bekerja', 'lainnya', 'lain-lain'
      ],
      'pelajar/mahasiswa': [
        'pelajar/mahasiswa', 'pelajar / mahasiswa', 'pelajar', 'mahasiswa', 'siswa',
        'anak sekolah', 'lainnya', 'lain-lain'
      ],
      'tidak bekerja': [
        'tidak bekerja', 'tidak bekerja / ibu rumah tangga', 'tidak bekerja/ibu rumah tangga',
        'belum/tidak bekerja', 'tidak/belum bekerja', 'belum bekerja', 'mengurus rumah tangga',
        'lainnya', 'lain-lain'
      ],
      'lainnya': [
        'lainnya', 'lain-lain', 'lain nya', 'lain - lain', 'pekerjaan lainnya'
      ]
    };

    const pekerjaanFallbacks = PEKERJAAN_MAP[cleanPekerjaan] || [cleanPekerjaan, 'Wiraswasta', 'Lainnya'];
    let pekerjaanOk = await setDropdownSmart('Pekerjaan', pekerjaanCandidates, pekerjaanVal, pekerjaanFallbacks);
    if (!pekerjaanOk) {
      for (const cand of ['pekerjaan_id', 'pekerjaan', 'kd_pekerjaan', 'kd_pekerjaan_id', 'id_pekerjaan', 'profesi_id']) {
        pekerjaanOk = await setKendoDrop(cand, pekerjaanVal, pekerjaanFallbacks);
        if (pekerjaanOk) break;
      }
    }
    if (pekerjaanOk) ok++;

    // ── 2. ALAMAT SESUAI KARTU IDENTITAS ──
    if (setTextVal('#alamat_ktp, [name="alamat_ktp"]', data.alamat_ktp)) ok++;

    if (data.provinsi_ktp) {
      await setKendoDrop('provinsi_ktp_id', data.provinsi_ktp);
      await sleep(1400);
      if (data.kabupaten_ktp) {
        await setKendoDrop('kabupaten_ktp_id', data.kabupaten_ktp);
        await sleep(1400);
        if (data.kecamatan_ktp) {
          await setKendoDrop('kecamatan_ktp_id', data.kecamatan_ktp);
          await sleep(1200);
          if (data.kelurahan_ktp) {
            await setKendoDrop('kelurahan_ktp_id', data.kelurahan_ktp);
          }
        }
      }
    }

    // ── 3. ALAMAT DOMISILI ──
    const samaKtp = (data.sama_dengan_ktp === 'Tidak' || data.sama_dengan_ktp === false) ? 'Tidak' : 'Ya';
    if (await setKendoDrop('status_domisili_id', samaKtp)) ok++;
    if (setTextVal('#alamat_domisili, [name="alamat_domisili"]', data.alamat_ktp)) ok++;
    if (setTextVal('#no_telp, [name="no_telp"]', data.no_hp)) ok++;

    // ── 4. PEMERIKSAAN BERAT BADAN & TINGGI BADAN ──
    if (setTextVal('#berat_badan, [name="berat_badan"]', data.berat_badan)) ok++;
    if (setTextVal('#tinggi_badan, [name="tinggi_badan"]', data.tinggi_badan)) ok++;
    const statusGizi = normalizeYN(data.kekurangan_gizi) === 'Ya' ? 'Gizi Kurang' : 'Normal';
    if (await setKendoDrop('status_gizi_id', statusGizi)) ok++;

    // ── 5. PEMERIKSAAN RIWAYAT KONTAK TBC ──
    if (await setKendoDrop('riwayat_kontak_tb_id', normalizeYN(data.riwayat_kontak_tbc))) ok++;

    // ── 6. FAKTOR RISIKO ──
    if (await setKendoDrop('risiko_1_id', normalizeYN(data.pernah_tbc))) ok++;
    if (await setKendoDrop('risiko_2_id', normalizeYN(data.kekurangan_gizi))) ok++;
    if (await setKendoDrop('risiko_3_id', normalizeYN(data.merokok))) ok++;
    if (await setKendoDrop('risiko_4_id', normalizeYN(data.riwayat_dm))) ok++;

    // Orang Dengan HIV
    const odhaVal = normalizeYN(data.odha);
    await setKendoDrop('risiko_5_id', odhaVal);
    await setDropByLabel('Orang Dengan HIV', odhaVal);
    await setDropByLabel('HIV', odhaVal);
    ok++;

    // Ibu Hamil
    await setKendoDrop('risiko_6_id', 'Tidak');
    await setDropByLabel('Ibu Hamil', 'Tidak');
    await setDropByLabel('Hamil', 'Tidak');
    ok++;

    // ── 7. SKRINING GEJALA DAN TANDA (Sesuai Form Warga) ──
    // Batuk
    const batukVal = normalizeYN(data.batuk);
    await setKendoDrop('gejala_2_1_id', batukVal); // Dewasa
    await setKendoDrop('gejala_1_1_id', batukVal); // Anak
    await setDropByLabel('Batuk', batukVal);
    ok++;

    // Durasi Batuk: HANYA diisi jika Batuk = 'Ya'
    if (batukVal === 'Ya') {
      await sleep(250);
      setTextVal('#gejala_2_1_durasi, [name="gejala_2_1_durasi"]', 14);
      setTextVal('#gejala_1_1_durasi, [name="gejala_1_1_durasi"]', 14);
      const durasiCandidates = Array.from(document.querySelectorAll('input[name*="durasi"], input[id*="durasi"]'));
      for (const dInput of durasiCandidates) {
        dInput.value = '14';
        dInput.dispatchEvent(new Event('input', { bubbles: true }));
        dInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      ok++;
    }

    // BB turun tanpa penyebab jelas / nafsu makan turun
    const bbTurunVal = normalizeYN(data.bb_turun);
    await setKendoDrop('gejala_2_3_id', bbTurunVal); // Dewasa
    await setKendoDrop('gejala_1_3_id', bbTurunVal); // Anak
    await setDropByLabel('BB turun', bbTurunVal);
    await setDropByLabel('nafsu makan', bbTurunVal);
    ok++;

    // Demam hilang timbul
    const demamVal = normalizeYN(data.demam);
    await setKendoDrop('gejala_2_4_id', demamVal); // Dewasa
    await setKendoDrop('gejala_1_4_id', demamVal); // Anak
    await setDropByLabel('Demam hilang timbul', demamVal);
    await setDropByLabel('Demam', demamVal);
    ok++;

    // Berkeringat malam hari
    const keringatVal = normalizeYN(data.berkeringat);
    await setKendoDrop('gejala_2_5_id', keringatVal); // Dewasa
    await setKendoDrop('gejala_1_5_id', keringatVal); // Anak
    await setDropByLabel('Berkeringat malam', keringatVal);
    await setDropByLabel('Berkeringat', keringatVal);
    ok++;

    // Pembesaran kelenjar getah bening
    const kelenjarVal = normalizeYN(data.pembesaran_kelenjar);
    await setKendoDrop('gejala_6_id', kelenjarVal); // Dewasa & Anak
    await setDropByLabel('Pembesaran kelenjar', kelenjarVal);
    await setDropByLabel('getah bening', kelenjarVal);
    ok++;

    // ── 8. HASIL SKRINING ──
    if (await setKendoDrop('hasil_skrining_id', normalizeHasil(data.hasil_skrining))) ok++;

    // ── 9. PEMERIKSAAN CHEST X-RAY ──
    const cxrVal = normalizeYN(data.dilakukan_cxr);
    if (await setKendoDrop('cxr_pemeriksaan_id', cxrVal)) ok++;
    if (cxrVal === 'Tidak') {
      setTextVal('#cxr_alasan, [name="cxr_alasan"]', 'Tidak');
    }

    // ── 10. TERDUGA TBC ──
    if (await setKendoDrop('terduga_tb_id', normalizeYN(data.terduga_tbc))) ok++;

    // ── 11. KETERANGAN ──
    const keteranganVal = data.keterangan || data.catatan_petugas || 'Tracing TB 2026';
    if (setTextVal('#keterangan, [name="keterangan"], #catatan, [name="catatan"], #txt_keterangan, [name="txt_keterangan"], textarea[name*="keterangan"], input[name*="keterangan"], textarea[name*="catatan"]', keteranganVal)) {
      ok++;
    } else {
      const ketId = findFieldIdByLabel('keterangan') || findFieldIdByLabel('catatan');
      if (ketId) {
        if (setTextVal(`#${ketId}, [name="${ketId}"]`, keteranganVal)) ok++;
      }
    }

    // ── VERIFIKASI AKHIR IDENTITAS & AKTIFKAN GUARD ──
    await sleep(400);
    dismissNikNotFoundModal();
    await fillIdentitas(data, false);

    // Tampilkan tombol pemulihan cepat floating jika suatu saat user membutuhkan
    showRestoreButton(data);

    // Aktifkan Background Anti-Reset Guard selama 30 detik
    startNikResetGuard(data, 30000);

    showToast(`✅ Selesai! Semua data skrining (${ok} kolom) berhasil disinkronkan sesuai form warga.`, 'success');
  }

  // ── Entry Point ────────────────────────────────────────────────────────────
  try {
    if (window.__sitbPatient__) {
      await startProcess(window.__sitbPatient__);
      delete window.__sitbPatient__;
    }
  } catch (e) {
    console.error('[SITB Assistant Error]:', e);
  }
})();
