// content.js - Otak Pengisian Formulir SITB Kemenkes
(async function () {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Fungsi normalisasi nilai
  const formatDate = (d) => {
    if (!d) return '';
    const p = String(d).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
  };

  const normalizeYN = (val) => {
    if (!val) return 'Tidak';
    const s = String(val).toLowerCase();
    if (s === 'ya' || s === 'ada' || s === 'true' || s === '1' || s.includes('ya') || s.includes('ada')) return 'Ya';
    return 'Tidak';
  };

  const normalizeHasil = (val) => {
    if (!val) return 'Tidak Ada Gejala dan Tanda TBC';
    const s = String(val).toLowerCase();
    if (s.includes('suspek') && !s.includes('bukan')) return 'Terduga TBC';
    return 'Tidak Ada Gejala dan Tanda TBC';
  };

  // Fungsi pengisian sel tabel / elemen
  function applyValue(cellOrEl, valStr, isDropdown) {
    if (!valStr && valStr !== '0' && valStr !== 0) return false;
    const targetLower = String(valStr).trim().toLowerCase();

    // 1. Cek jika select standar HTML
    const sel = cellOrEl.tagName === 'SELECT' ? cellOrEl : cellOrEl.querySelector('select');
    if (sel) {
      for (let i = 0; i < sel.options.length; i++) {
        const t = sel.options[i].text.trim().toLowerCase();
        const v = sel.options[i].value.trim().toLowerCase();
        if (t === targetLower || t.includes(targetLower) || targetLower.includes(t) || v === targetLower) {
          sel.selectedIndex = i;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
    }

    // 2. Cek jika EasyUI / ExtJS Combobox dengan tombol panah
    if (isDropdown && cellOrEl.querySelector) {
      const arrow = cellOrEl.querySelector('.combo-arrow, .textbox-icon, .x-form-trigger, a[class*="arrow"], a[class*="icon"], span[class*="arrow"]');
      if (arrow) {
        try {
          arrow.click();
          const items = document.querySelectorAll('.combobox-item, .x-combo-list-item, .x-boundlist-item, .combo-panel div');
          for (const it of items) {
            const itText = it.textContent.trim().toLowerCase();
            if (itText === targetLower || itText.includes(targetLower) || targetLower.includes(itText)) {
              it.click();
              return true;
            }
          }
          arrow.click(); // Tutup jika tidak ada yang cocok
        } catch (e) {}
      }
    }

    // 3. Input teks / fallback
    const inp = (cellOrEl.tagName === 'INPUT' || cellOrEl.tagName === 'TEXTAREA')
      ? cellOrEl
      : (cellOrEl.querySelector ? cellOrEl.querySelector('input:not([type="hidden"]), textarea') : null);

    if (inp) {
      inp.focus();
      inp.value = String(valStr);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      if (isDropdown) {
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
      }
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      inp.blur();

      // Isi juga hidden input jika ada
      if (cellOrEl.querySelector) {
        const hid = cellOrEl.querySelector('input[type="hidden"]');
        if (hid) {
          hid.value = String(valStr);
          hid.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      return true;
    }

    return false;
  }

  // Fungsi pencari kolom
  function fillField(keywords, value, isDropdown = false) {
    if (value === undefined || value === null || value === '') return false;
    const valStr = String(value).trim();

    // Strategi 1: Baris Tabel (TR) - format formulir SITB
    const trs = document.querySelectorAll('tr');
    for (const tr of trs) {
      if (!tr.cells || tr.cells.length < 2) continue;
      let labelText = '';
      for (let i = 0; i < tr.cells.length - 1; i++) {
        labelText += ' ' + tr.cells[i].textContent.toLowerCase();
      }

      if (keywords.some(kw => labelText.includes(kw.toLowerCase()))) {
        const lastCell = tr.cells[tr.cells.length - 1];
        if (applyValue(lastCell, valStr, isDropdown)) {
          return true;
        }
      }
    }

    // Strategi 2: Berdasarkan Name / ID / Placeholder
    const allInputs = document.querySelectorAll('input, select, textarea');
    for (const el of allInputs) {
      const n = (el.name || '').toLowerCase();
      const id = (el.id || '').toLowerCase();
      const ph = (el.placeholder || '').toLowerCase();

      if (keywords.some(kw => n.includes(kw.toLowerCase()) || id.includes(kw.toLowerCase()) || ph.includes(kw.toLowerCase()))) {
        let target = el;
        if (el.type === 'hidden' && el.parentElement) {
          const vis = el.parentElement.querySelector('input:not([type="hidden"]), select');
          if (vis) target = vis;
        }
        if (applyValue(target, valStr, isDropdown)) {
          return true;
        }
      }
    }

    return false;
  }

  // Eksekusi utama pengisian data
  async function startProcess(data) {
    if (!data) return;

    let count = 0;

    // 1. Identitas
    if (fillField(['tanggal pelaksanaan', 'tanggal skrining', 'tgl_skrining'], formatDate(data.tanggal_skrining), false)) count++;
    if (fillField(['nama kegiatan'], data.nama_kegiatan || 'Skrining Oleh Fasyankes', true)) count++;
    if (fillField(['tempat skrining', 'tempat'], data.tempat_skrining || 'Puskesmas', true)) count++;
    if (fillField(['kewarganegaraan', 'warga'], data.kewarganegaraan || 'WNI', true)) count++;
    if (fillField(['nik', 'no_identitas'], data.nik, false)) count++;
    if (fillField(['nama peserta', 'nm_pasien', 'namapasien'], data.nama_peserta, false)) count++;
    if (fillField(['jenis kelamin', 'kelamin', 'jk'], data.jenis_kelamin, true)) count++;
    if (fillField(['tanggal lahir', 'tgl_lahir'], formatDate(data.tanggal_lahir), false)) count++;
    if (fillField(['pekerjaan', 'kerja'], data.pekerjaan || 'Tidak Bekerja', true)) count++;

    // 2. Alamat
    if (fillField(['alamat ktp', 'alamat'], data.alamat_ktp, false)) count++;
    if (fillField(['sama dengan alamat'], data.sama_dengan_ktp || 'Ya', true)) count++;
    if (fillField(['no. hp', 'no hp', 'telepon', 'hp', 'telp'], data.no_hp, false)) count++;

    // 3. BB & TB
    if (fillField(['berat badan', 'berat', 'bb', 'kg'], String(data.berat_badan || ''), false)) count++;
    if (fillField(['tinggi badan', 'panjang badan', 'tinggi', 'tb', 'cm'], String(data.tinggi_badan || ''), false)) count++;

    // 4. Riwayat & Risiko
    if (fillField(['riwayat kontak', 'kontak'], normalizeYN(data.riwayat_kontak_tbc), true)) count++;
    if (fillField(['pernah terdiagnosa', 'berobat tbc', 'pernah_tbc'], normalizeYN(data.pernah_tbc), true)) count++;
    if (fillField(['kekurangan gizi', 'gizi'], normalizeYN(data.kekurangan_gizi), true)) count++;
    if (fillField(['merokok', 'rokok'], normalizeYN(data.merokok), true)) count++;
    if (fillField(['riwayat dm', 'kencing manis', 'dm', 'manis'], normalizeYN(data.riwayat_dm), true)) count++;
    if (fillField(['orang dengan hiv', 'hiv', 'odha'], normalizeYN(data.odha), true)) count++;
    if (fillField(['ibu hamil'], 'Tidak', true)) count++;

    // 5. Gejala (Konversi Tidak Ada -> Tidak)
    if (fillField(['batuk'], normalizeYN(data.batuk), true)) count++;
    if (fillField(['bb turun', 'nafsu makan'], normalizeYN(data.bb_turun), true)) count++;
    if (fillField(['demam hilang', 'demam'], normalizeYN(data.demam), true)) count++;
    if (fillField(['berkeringat malam', 'keringat'], normalizeYN(data.berkeringat), true)) count++;
    if (fillField(['pembesaran kelenjar', 'kelenjar', 'getah'], normalizeYN(data.pembesaran_kelenjar), true)) count++;

    // 6. Hasil Skrining & CXR
    if (fillField(['hasil skrining gejala', 'hasil_skrining', 'hasil'], normalizeHasil(data.hasil_skrining), true)) count++;
    if (fillField(['dilakukan pemeriksaan cxr', 'cxr', 'xray'], normalizeYN(data.dilakukan_cxr), true)) count++;
    if (fillField(['alasan tidak cxr'], 'Tidak', false)) count++;
    if (fillField(['terduga tbc', 'terduga'], normalizeYN(data.terduga_tbc), true)) count++;

    // 7. Alamat Bertingkat (Provinsi -> Kabupaten -> Kecamatan -> Kelurahan)
    fillField(['provinsi ktp', 'provinsi', 'propinsi'], data.provinsi_ktp, true);
    setTimeout(() => {
      fillField(['kabupaten/kota ktp', 'kabupaten ktp', 'kabupaten', 'kota'], data.kabupaten_ktp, true);
      setTimeout(() => {
        if (data.kecamatan_ktp) fillField(['kecamatan ktp', 'kecamatan'], data.kecamatan_ktp, true);
        setTimeout(() => {
          if (data.kelurahan_ktp) fillField(['kelurahan ktp', 'kelurahan', 'desa'], data.kelurahan_ktp, true);
        }, 1500);
      }, 1500);
    }, 1500);

    // Tampilkan notifikasi jika minimal 3 kolom berhasil terisi di frame ini
    if (count >= 3) {
      alert(`✅ SITB Assistant: ${count} kolom berhasil disalin!\n\nMohon tunggu 3-4 detik hingga kolom Kabupaten/Kecamatan selesai termuat.`);
    }
  }

  // Coba baca langsung dari storage saat diinjeksi
  try {
    const res = await chrome.storage.local.get('activePatient');
    if (res && res.activePatient) {
      await startProcess(res.activePatient);
    }
  } catch (e) {}

  // Listener fallback jika dipanggil lewat sendMessage
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'FILL_DATA' && request.data) {
      startProcess(request.data);
    }
    return true;
  });
})();
