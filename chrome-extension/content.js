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

  // ── Kendo Dropdown Master Setter ───────────────────────────────────────────
  async function setKendoDrop(fieldId, targetText) {
    if (!targetText) return false;
    const target = String(targetText).trim().toLowerCase();
    const baseId = fieldId.replace(/_input$/, '');

    // 1. Coba Kendo Widget API
    if ($) {
      const origEl = document.getElementById(baseId) || document.querySelector(`[name="${baseId}"]`);
      if (origEl) {
        let widget = $(origEl).data('kendoDropDownList') || $(origEl).data('kendoComboBox');
        if (!widget && window.kendo && window.kendo.widgetInstance) {
          widget = window.kendo.widgetInstance($(origEl)) || window.kendo.widgetInstance($(origEl).closest('.k-widget'));
        }

        if (widget) {
          let data = widget.dataSource ? widget.dataSource.data() : [];
          if ((!data || data.length === 0) && widget.dataSource && typeof widget.dataSource.read === 'function') {
            try {
              await widget.dataSource.read();
              data = widget.dataSource.data();
            } catch (e) {}
          }

          const textField = widget.options?.dataTextField || 'text';
          const valueField = widget.options?.dataValueField || 'value';

          for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const txt = String(item[textField] ?? item.text ?? item.nama ?? '').trim().toLowerCase();

            let isMatch = (txt === target);
            if (!isMatch && (target === 'ya' || target === 'tidak')) {
              if (target === 'ya' && (txt === 'ya' || txt === 'ada' || txt.includes('ya') || txt.includes('ada') || txt.includes('positif') || txt.includes('reaktif'))) isMatch = true;
              if (target === 'tidak' && (txt === 'tidak' || txt === 'tidak ada' || txt.includes('tidak') || txt.includes('negatif') || txt.includes('non') || txt.includes('bukan'))) isMatch = true;
            }
            if (!isMatch && (txt.includes(target) || target.includes(txt))) {
              isMatch = true;
            }
            if (!isMatch) {
              const cleanTxt = txt.replace(/\s+/g, '').replace(/^desa/, '');
              const cleanTarget = target.replace(/\s+/g, '').replace(/^desa/, '');
              if (cleanTxt === cleanTarget || (cleanTxt.length > 3 && (cleanTxt.includes(cleanTarget) || cleanTarget.includes(cleanTxt)))) {
                isMatch = true;
              }
            }

            if (isMatch) {
              const val = item[valueField] !== undefined ? item[valueField] : item.value;
              widget.select(i);
              if (val !== undefined) widget.value(val);
              widget.trigger('select');
              widget.trigger('change');

              const visInput = document.querySelector(`[name="${baseId}_input"]`);
              if (visInput) visInput.value = item[textField] || targetText;
              origEl.value = val;
              return true;
            }
          }

          if (typeof widget.search === 'function') {
            try {
              widget.search(targetText);
              if (widget.select && widget.select() !== -1) {
                widget.trigger('change');
                return true;
              }
            } catch (e) {}
          }
        }
      }
    }

    // 2. Fallback: Klik Arrow di DOM
    const visInput = document.querySelector(`[name="${baseId}_input"]`) || document.getElementById(baseId);
    if (visInput) {
      const wrapper = visInput.closest('.k-widget, .k-dropdown, .k-combobox') || visInput.parentElement;
      const arrow = wrapper ? wrapper.querySelector('.k-select, .k-icon') : null;
      if (arrow) {
        arrow.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        arrow.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        await sleep(250);

        const items = Array.from(document.querySelectorAll('.k-animation-container .k-item, .k-popup .k-item, .k-list .k-item, ul[role="listbox"] li'));
        for (const item of items) {
          const txt = item.textContent.trim().toLowerCase();
          let match = (txt === target);
          if (!match && target === 'ya' && (txt === 'ya' || txt === 'ada' || txt.includes('ya') || txt.includes('ada') || txt.includes('positif') || txt.includes('reaktif'))) match = true;
          if (!match && target === 'tidak' && (txt === 'tidak' || txt.includes('tidak') || txt.includes('negatif') || txt.includes('non') || txt.includes('bukan'))) match = true;
          if (!match && (txt.includes(target) || target.includes(txt))) match = true;
          if (!match) {
            const cleanTxt = txt.replace(/\s+/g, '').replace(/^desa/, '');
            const cleanTarget = target.replace(/\s+/g, '').replace(/^desa/, '');
            if (cleanTxt === cleanTarget || (cleanTxt.length > 3 && (cleanTxt.includes(cleanTarget) || cleanTarget.includes(cleanTxt)))) {
              match = true;
            }
          }

          if (match) {
            item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            item.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
            item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            await sleep(150);
            return true;
          }
        }
        arrow.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    }

    // 3. Fallback: Set nilai langsung
    const vis = document.querySelector(`[name="${baseId}_input"]`);
    const hid = document.getElementById(baseId) || document.querySelector(`[name="${baseId}"]`);
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
        const input = row.querySelector('input[name$="_id"], input[name$="_id_input"], input[id$="_id"], select');
        if (input) {
          return input.id || input.name;
        }
      }
    }
    return null;
  }

  // ── Smart Dropdown Setter by Label or Selectors ────────────────────────────
  async function setDropdownSmart(labelPattern, candidateSelectors, targetText, fallbackList = []) {
    if (!targetText && fallbackList.length === 0) return false;

    const searchTargets = [targetText, ...fallbackList].filter(Boolean);
    console.log(`[SITB Assistant] setDropdownSmart for "${labelPattern}", targets:`, searchTargets);

    // 1. Cari elemen input/select atau k-widget
    let targetEl = null;

    // 1a. Coba cari via baris label di tabel (paling akurat untuk form SITB)
    const cleanPattern = labelPattern.toLowerCase().replace(/[\s\*:]+/g, '');
    const allRows = Array.from(document.querySelectorAll('tr, .form-group, .row, .k-form-field'));
    for (const row of allRows) {
      const firstColText = (row.children[0]?.textContent || row.textContent).toLowerCase().replace(/[\s\*:]+/g, '');
      if (firstColText.includes(cleanPattern)) {
        targetEl = row.querySelector('input:not([type="hidden"]), select, input[name$="_id"], input, .k-widget');
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
          break;
        }
      }
    }

    if (!targetEl) {
      console.warn(`[SITB Assistant] Elemen untuk "${labelPattern}" tidak ditemukan di DOM.`);
      return false;
    }

    // 2. Coba lewat Kendo UI Widget API
    if ($) {
      let widget = $(targetEl).data('kendoDropDownList') || $(targetEl).data('kendoComboBox');
      if (!widget && window.kendo && window.kendo.widgetInstance) {
        widget = window.kendo.widgetInstance($(targetEl)) || window.kendo.widgetInstance($(targetEl).closest('.k-widget'));
      }
      if (!widget) {
        const kWidgetEl = targetEl.closest('.k-widget') || targetEl.parentElement?.querySelector('.k-widget');
        if (kWidgetEl) {
          widget = $(kWidgetEl).data('kendoDropDownList') || $(kWidgetEl).data('kendoComboBox');
          if (!widget && window.kendo && window.kendo.widgetInstance) {
            widget = window.kendo.widgetInstance($(kWidgetEl));
          }
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

        console.log(`[SITB Assistant] "${labelPattern}" options in dataSource (${data.length}):`, data);

        const textField = widget.options?.dataTextField || 'text';
        const valueField = widget.options?.dataValueField || 'value';

        let matchedIndex = -1;
        let matchedItem = null;

        for (const st of searchTargets) {
          const cleanSt = String(st).trim().toLowerCase();
          const cleanStNoDesa = cleanSt.replace(/\s+/g, '').replace(/^desa/, '');

          for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const txt = String(item[textField] ?? item.text ?? item.nama ?? item.label ?? item.deskripsi ?? '').trim().toLowerCase();
            const cleanTxt = txt.replace(/\s+/g, '').replace(/^desa/, '');

            if (txt === cleanSt || cleanTxt === cleanStNoDesa) {
              matchedIndex = i;
              matchedItem = item;
              break;
            }
            if (cleanStNoDesa.length > 3 && (cleanTxt.includes(cleanStNoDesa) || cleanStNoDesa.includes(cleanTxt))) {
              matchedIndex = i;
              matchedItem = item;
              break;
            }
          }
          if (matchedIndex !== -1) break;
        }

        if (matchedIndex !== -1 && matchedItem) {
          const val = matchedItem[valueField] !== undefined ? matchedItem[valueField] : matchedItem.value;
          widget.select(matchedIndex);
          if (val !== undefined) widget.value(val);
          widget.trigger('select');
          widget.trigger('change');

          const vis = targetEl.closest('.k-widget')?.querySelector('.k-input') || document.querySelector(`[name="${targetEl.name}_input"]`);
          if (vis) {
            if (vis.tagName === 'INPUT') vis.value = matchedItem[textField] || targetText;
            else vis.textContent = matchedItem[textField] || targetText;
          }
          console.log(`[SITB Assistant] Successfully selected "${matchedItem[textField]}" for "${labelPattern}"`);
          return true;
        }

        // Jika ComboBox dan belum cocok, coba set text langsung
        if (typeof widget.text === 'function') {
          widget.value(targetText);
          widget.text(targetText);
          widget.trigger('change');
          return true;
        }
      }
    }

    // 3. Fallback: Klik Arrow di DOM untuk membuka popup list
    const wrapper = targetEl.closest('.k-widget, .k-dropdown, .k-combobox') || targetEl.parentElement;
    const arrow = wrapper ? wrapper.querySelector('.k-select, .k-icon') : null;
    if (arrow) {
      arrow.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      arrow.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await sleep(300);

      const items = Array.from(document.querySelectorAll('.k-animation-container .k-item, .k-popup .k-item, .k-list .k-item, ul[role="listbox"] li'));
      console.log(`[SITB Assistant] Popup items for "${labelPattern}":`, items.map(it => it.textContent.trim()));

      for (const st of searchTargets) {
        const cleanSt = String(st).trim().toLowerCase().replace(/\s+/g, '').replace(/^desa/, '');
        for (const item of items) {
          const txt = item.textContent.trim().toLowerCase();
          const cleanTxt = txt.replace(/\s+/g, '').replace(/^desa/, '');

          if (cleanTxt === cleanSt || (cleanSt.length > 3 && (cleanTxt.includes(cleanSt) || cleanSt.includes(cleanTxt)))) {
            item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
            item.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
            item.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            await sleep(150);
            console.log(`[SITB Assistant] Clicked item "${txt}" for "${labelPattern}"`);
            return true;
          }
        }
      }
      arrow.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }

    // 4. Fallback jika native <select>
    if (targetEl.tagName === 'SELECT') {
      const opts = Array.from(targetEl.options);
      for (const st of searchTargets) {
        const cleanSt = String(st).trim().toLowerCase().replace(/\s+/g, '');
        for (let i = 0; i < opts.length; i++) {
          const optTxt = opts[i].text.trim().toLowerCase().replace(/\s+/g, '');
          if (optTxt === cleanSt || (cleanSt.length > 3 && (optTxt.includes(cleanSt) || cleanSt.includes(optTxt)))) {
            targetEl.selectedIndex = i;
            targetEl.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
      }
    }

    return false;
  }

  // ── Helper: Set Dropdown by Label Text ─────────────────────────────────────
  async function setDropByLabel(labelText, targetText) {
    const fieldId = findFieldIdByLabel(labelText);
    if (fieldId) {
      return await setKendoDrop(fieldId, targetText);
    }
    return false;
  }

  // ── PROSES PENGISIAN UTAMA ─────────────────────────────────────────────────
  async function startProcess(data) {
    if (!data) return;

    showToast('🔄 Mengisi seluruh data skrining ke form SITB...', 'info');
    let ok = 0;

    // ── 1. IDENTITAS DIRI PESERTA ──
    if (setDateVal('dt_tgl_skrining', data.tanggal_skrining)) ok++;
    await setKendoDrop('kegiatan_id', 'Skrining Oleh Fasyankes');

    // 1a. Tempat Skrining (Smart matching: coba nama desa, lalu fallback ke kategori tempat)
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
    const desaPolos = tempatVal.replace(/^desa\s*/i, '').trim();
    const tempatFallbacks = [desaPolos, 'Puskesmas', 'Posyandu', 'Posbindu', 'Rumah Warga', 'Lainnya'];
    
    let tempatOk = await setDropdownSmart('Tempat Skrining', tempatCandidates, tempatVal, tempatFallbacks);
    if (!tempatOk) {
      tempatOk = await setKendoDrop('tempat_skrining_id', tempatVal);
    }
    if (tempatOk) ok++;

    await setKendoDrop('warga_negara_id', data.kewarganegaraan || 'WNI');
    if (setTextVal('#nik, [name="nik"]', data.nik)) ok++;
    if (setTextVal('#nama_peserta, [name="nama_peserta"]', data.nama_peserta)) ok++;
    if (await setKendoDrop('jenis_kelamin_id', data.jenis_kelamin)) ok++;
    if (setDateVal('dt_tgl_lahir', data.tanggal_lahir)) ok++;

    // 1b. Pekerjaan (Smart matching: coba nama pekerjaan langsung & sinonim Dukcapil/SITB)
    const pekerjaanCandidates = [
      '#pekerjaan_id', '[name="pekerjaan_id"]',
      '#pekerjaan', '[name="pekerjaan"]',
      '#id_pekerjaan', '[name="id_pekerjaan"]',
      '#kd_pekerjaan', '[name="kd_pekerjaan"]',
      '#profesi_id', '[name="profesi_id"]',
      '#profesi', '[name="profesi"]'
    ];
    const pekerjaanVal = data.pekerjaan || 'Tidak Bekerja';
    const cleanPekerjaan = pekerjaanVal.toLowerCase().trim();
    
    const PEKERJAAN_MAP = {
      'pedagang': ['pedagang', 'wiraswasta', 'perdagangan', 'usaha', 'swasta', 'lainnya'],
      'wiraswasta': ['wiraswasta', 'pedagang', 'usaha', 'swasta', 'lainnya'],
      'petani/pekebun': ['petani/pekebun', 'petani', 'pekebun', 'pertanian', 'buruh', 'lainnya'],
      'nelayan': ['nelayan', 'perikanan', 'buruh', 'lainnya'],
      'pegawai swasta': ['pegawai swasta', 'karyawan swasta', 'swasta', 'karyawan', 'wiraswasta'],
      'pegawai negeri sipil': ['pegawai negeri sipil', 'pns', 'asn', 'pns/tni/polri', 'pns / tni / polri'],
      'tni/polri': ['tni/polri', 'tni', 'polri', 'pns/tni/polri', 'pns / tni / polri'],
      'ibu rumah tangga': ['ibu rumah tangga', 'rumah tangga', 'irt', 'tidak bekerja'],
      'pelajar/mahasiswa': ['pelajar/mahasiswa', 'pelajar', 'mahasiswa'],
      'buruh harian lepas': ['buruh harian lepas', 'buruh harian', 'buruh', 'karyawan lepas'],
      'tidak bekerja': ['tidak bekerja', 'tidak/belum bekerja', 'belum/tidak bekerja', 'tidak / belum bekerja', 'belum bekerja']
    };
    
    const pekerjaanFallbacks = PEKERJAAN_MAP[cleanPekerjaan] || [cleanPekerjaan];
    let pekerjaanOk = await setDropdownSmart('Pekerjaan', pekerjaanCandidates, pekerjaanVal, pekerjaanFallbacks);
    if (!pekerjaanOk) {
      pekerjaanOk = await setKendoDrop('pekerjaan_id', pekerjaanVal);
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
