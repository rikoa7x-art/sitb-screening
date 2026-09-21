// content.js - Otak Pengisian Formulir SITB Kemenkes (Sistem Pengawas Aktif & Penanganan Pop-up Dukcapil)
(async function () {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Normalisasi Tanggal YYYY-MM-DD -> DD/MM/YYYY
  const formatDate = (d) => {
    if (!d) return '';
    const p = String(d).split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
  };

  // Normalisasi Ya / Tidak
  const normalizeYN = (val) => {
    if (!val) return 'Tidak';
    const s = String(val).toLowerCase();
    if (s === 'ya' || s === 'ada' || s === 'true' || s === '1' || s.includes('ya') || s.includes('ada')) return 'Ya';
    return 'Tidak';
  };

  // Normalisasi Hasil Skrining
  const normalizeHasil = (val) => {
    if (!val) return 'Tidak Ada Gejala dan Tanda TBC';
    const s = String(val).toLowerCase();
    if (s.includes('suspek') && !s.includes('bukan')) return 'Terduga TBC';
    return 'Tidak Ada Gejala dan Tanda TBC';
  };

  // PENGAWAS AKTIF: Otomatis mendeteksi dan mengklik tombol 'Ya' pada pop-up Kemendagri kapanpun muncul
  async function dismissKemendagriPopup() {
    const textAll = document.body ? document.body.textContent.toLowerCase() : '';
    if (textAll.includes('kemendagri') || textAll.includes('data tidak ditemukan') || textAll.includes('penginputan manual')) {
      // Cari seluruh tombol dan tautan di layar
      const allButtons = Array.from(document.querySelectorAll('a, button, input[type="button"], .l-btn, span'));
      for (const btn of allButtons) {
        const t = btn.textContent.trim().toLowerCase();
        if (t === 'ya' || t === 'yes') {
          // Klik elemen tautan induknya jika ada (format l-btn EasyUI)
          const target = btn.closest('a') || btn;
          target.click();
          await sleep(500);
          return true;
        }
      }
    }
    return false;
  }

  // Fungsi pengisian sel tabel / elemen
  async function applyValue(cellOrEl, valStr, isDropdown) {
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

    // 2. Cek jika EasyUI / ExtJS Combobox dengan panah trigger
    if (isDropdown && cellOrEl.querySelector) {
      const arrow = cellOrEl.querySelector('.combo-arrow, .textbox-icon, .x-form-trigger, a[class*="arrow"], a[class*="icon"], span[class*="arrow"], a');
      if (arrow) {
        try {
          arrow.click();
          await sleep(250); // Tunggu panel dropdown terbuka di layar

          // Cari elemen dropdown yang muncul di layar
          const candidateItems = Array.from(document.querySelectorAll('.combobox-item, .x-combo-list-item, .x-boundlist-item, .combo-panel div, .panel div, li, tr'));
          
          let match = null;
          for (const it of candidateItems) {
            const rect = it.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              const txt = it.textContent.trim().toLowerCase();
              if (txt === targetLower) {
                match = it;
                break;
              }
            }
          }

          if (!match) {
            for (const it of candidateItems) {
              const rect = it.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0) {
                const txt = it.textContent.trim().toLowerCase();
                if (txt.includes(targetLower) || targetLower.includes(txt)) {
                  match = it;
                  break;
                }
              }
            }
          }

          if (match) {
            match.click();
            await sleep(100);
            return true;
          } else {
            arrow.click(); // Tutup kembali jika tidak ketemu
            await sleep(100);
          }
        } catch (e) {}
      }
    }

    // 3. Input teks / Fallback
    const inp = (cellOrEl.tagName === 'INPUT' || cellOrEl.tagName === 'TEXTAREA')
      ? cellOrEl
      : (cellOrEl.querySelector ? cellOrEl.querySelector('input:not([type="hidden"]), textarea') : null);

    if (inp) {
      inp.focus();
      inp.value = String(valStr);
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      if (isDropdown) {
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
        await sleep(50);
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
      }
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      
      if (!isDropdown) {
        inp.blur();
      }

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
  async function fillField(keywords, value, isDropdown = false) {
    if (value === undefined || value === null || value === '') return false;
    const valStr = String(value).trim();

    // Strategi 1: Baris Tabel <tr>
    const trs = document.querySelectorAll('tr');
    for (const tr of trs) {
      if (!tr.cells || tr.cells.length < 2) continue;
      let labelText = '';
      for (let i = 0; i < tr.cells.length - 1; i++) {
        labelText += ' ' + tr.cells[i].textContent.toLowerCase();
      }

      if (keywords.some(kw => labelText.includes(kw.toLowerCase()))) {
        const lastCell = tr.cells[tr.cells.length - 1];
        if (await applyValue(lastCell, valStr, isDropdown)) {
          return true;
        }
      }
    }

    // Strategi 2: Atribut Name/ID
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
        if (await applyValue(target, valStr, isDropdown)) {
          return true;
        }
      }
    }

    return false;
  }

  // Alur Pengisian Formulir Lengkap
  async function startProcess(data) {
    if (!data) return;

    // Pasang pengawas pop-up otomatis setiap 250ms
    const watcher = setInterval(dismissKemendagriPopup, 250);

    // Cek jika pop-up konfirmasi sudah ada di layar saat tombol ditekan
    await dismissKemendagriPopup();

    let count = 0;

    // 1. Identitas Awal
    if (await fillField(['tanggal pelaksanaan', 'tanggal skrining', 'tgl_skrining'], formatDate(data.tanggal_skrining), false)) count++;
    if (await fillField(['nama kegiatan'], data.nama_kegiatan || 'Skrining Oleh Fasyankes', true)) count++;
    if (await fillField(['tempat skrining', 'tempat'], data.tempat_skrining || 'Puskesmas', true)) count++;
    if (await fillField(['kewarganegaraan', 'warga'], data.kewarganegaraan || 'WNI', true)) count++;

    // 2. Isi NIK
    if (await fillField(['nik', 'no_identitas'], data.nik, false)) count++;
    
    // Beri jeda 800ms sambil menunggu jika SITB memicu pop-up Kemendagri
    await sleep(800);
    await dismissKemendagriPopup();

    // 3. Identitas Inti (Jika tadi terkunci, sekarang sudah dibuka oleh tombol Ya)
    if (await fillField(['nama peserta', 'nm_pasien', 'namapasien'], data.nama_peserta, false)) count++;
    if (await fillField(['jenis kelamin', 'kelamin', 'jk'], data.jenis_kelamin, true)) count++;
    if (await fillField(['tanggal lahir', 'tgl_lahir'], formatDate(data.tanggal_lahir), false)) count++;
    if (await fillField(['pekerjaan', 'kerja'], data.pekerjaan || 'Tidak Bekerja', true)) count++;

    // 4. Alamat & Kontak
    if (await fillField(['alamat ktp', 'alamat'], data.alamat_ktp, false)) count++;
    if (await fillField(['sama dengan alamat'], data.sama_dengan_ktp || 'Ya', true)) count++;
    if (await fillField(['no. hp', 'no hp', 'telepon', 'hp', 'telp'], data.no_hp, false)) count++;

    // 5. Pemeriksaan Berat Badan & Tinggi Badan
    if (await fillField(['berat badan', 'berat', 'bb', 'kg'], String(data.berat_badan || ''), false)) count++;
    if (await fillField(['tinggi badan', 'panjang badan', 'tinggi', 'tb', 'cm'], String(data.tinggi_badan || ''), false)) count++;

    // 6. Riwayat Kontak & Faktor Risiko
    if (await fillField(['riwayat kontak', 'kontak'], normalizeYN(data.riwayat_kontak_tbc), true)) count++;
    if (await fillField(['pernah terdiagnosa', 'berobat tbc', 'pernah_tbc'], normalizeYN(data.pernah_tbc), true)) count++;
    if (await fillField(['kekurangan gizi', 'gizi'], normalizeYN(data.kekurangan_gizi), true)) count++;
    if (await fillField(['merokok', 'rokok'], normalizeYN(data.merokok), true)) count++;
    if (await fillField(['riwayat dm', 'kencing manis', 'dm', 'manis'], normalizeYN(data.riwayat_dm), true)) count++;
    if (await fillField(['orang dengan hiv', 'hiv', 'odha'], normalizeYN(data.odha), true)) count++;
    if (await fillField(['ibu hamil'], 'Tidak', true)) count++;

    // 7. Skrining Gejala dan Tanda (Tidak Ada -> Tidak)
    if (await fillField(['batuk'], normalizeYN(data.batuk), true)) count++;
    if (await fillField(['bb turun', 'nafsu makan'], normalizeYN(data.bb_turun), true)) count++;
    if (await fillField(['demam hilang', 'demam'], normalizeYN(data.demam), true)) count++;
    if (await fillField(['berkeringat malam', 'keringat'], normalizeYN(data.berkeringat), true)) count++;
    if (await fillField(['pembesaran kelenjar', 'kelenjar', 'getah'], normalizeYN(data.pembesaran_kelenjar), true)) count++;

    // 8. Hasil Skrining & CXR
    if (await fillField(['hasil skrining gejala', 'hasil_skrining', 'hasil'], normalizeHasil(data.hasil_skrining), true)) count++;
    if (await fillField(['dilakukan pemeriksaan cxr', 'cxr', 'xray'], normalizeYN(data.dilakukan_cxr), true)) count++;
    if (await fillField(['alasan tidak cxr'], 'Tidak', false)) count++;
    if (await fillField(['terduga tbc', 'terduga'], normalizeYN(data.terduga_tbc), true)) count++;

    // 9. Alamat Bertingkat (Provinsi -> Kabupaten -> Kecamatan -> Kelurahan)
    await fillField(['provinsi ktp', 'provinsi', 'propinsi'], data.provinsi_ktp, true);
    await sleep(1200);
    await fillField(['kabupaten/kota ktp', 'kabupaten ktp', 'kabupaten', 'kota'], data.kabupaten_ktp, true);
    await sleep(1200);
    if (data.kecamatan_ktp) {
      await fillField(['kecamatan ktp', 'kecamatan'], data.kecamatan_ktp, true);
      await sleep(1200);
    }
    if (data.kelurahan_ktp) {
      await fillField(['kelurahan ktp', 'kelurahan', 'desa'], data.kelurahan_ktp, true);
    }

    // Pastikan sekali lagi pop-up Kemendagri tertutup
    await dismissKemendagriPopup();
    clearInterval(watcher);

    if (count >= 3) {
      alert(`✅ SITB Assistant: ${count} kolom berhasil disalin!\n\nPop-up konfirmasi telah direspons dan formulir telah terisi. Silakan periksa kembali sebelum menyimpan.`);
    }
  }

  // Eksekusi saat diinjeksi
  try {
    const res = await chrome.storage.local.get('activePatient');
    if (res && res.activePatient) {
      await startProcess(res.activePatient);
    }
  } catch (e) {}

  // Fallback listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'FILL_DATA' && request.data) {
      startProcess(request.data);
    }
    return true;
  });
})();
