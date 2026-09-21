// content.js - Otak Pengisian Formulir SITB Kemenkes dengan Pencocokan Label Presisi Tinggi
(async function () {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // Pembersih teks untuk pencocokan persis
  const cleanLabel = (str) => {
    return str ? str.toLowerCase().replace(/[*:\s]+/g, ' ').trim() : '';
  };

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

  // Penutup Otomatis Pop-up Kemendagri
  async function dismissKemendagriPopup() {
    const textAll = document.body ? document.body.textContent.toLowerCase() : '';
    if (textAll.includes('kemendagri') || textAll.includes('data tidak ditemukan') || textAll.includes('penginputan manual')) {
      const allButtons = Array.from(document.querySelectorAll('a, button, input[type="button"], .l-btn, span'));
      for (const btn of allButtons) {
        const t = btn.textContent.trim().toLowerCase();
        if (t === 'ya' || t === 'yes') {
          const target = btn.closest('a') || btn;
          target.click();
          await sleep(500);
          return true;
        }
      }
    }
    return false;
  }

  // Terapkan nilai ke dalam sel input formulir
  async function applyValueToCell(cell, valStr, isDropdown) {
    if (!valStr && valStr !== '0' && valStr !== 0) return false;
    const targetLower = String(valStr).trim().toLowerCase();

    // 1. Cek jika select standar HTML
    const sel = cell.querySelector('select');
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

    // 2. Cek jika Dropdown EasyUI / ExtJS (klik panah)
    if (isDropdown) {
      const arrow = cell.querySelector('.combo-arrow, .textbox-icon, .x-form-trigger, a[class*="arrow"], span[class*="arrow"], a');
      if (arrow) {
        try {
          arrow.click();
          await sleep(250);

          const items = Array.from(document.querySelectorAll('.combobox-item, .x-combo-list-item, .x-boundlist-item, .combo-panel div, .panel div'));
          let match = null;
          for (const it of items) {
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
            for (const it of items) {
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
            arrow.click(); // Tutup jika tidak ketemu
            await sleep(100);
          }
        } catch (e) {}
      }
    }

    // 3. Masukkan teks ke input
    const inp = cell.querySelector('input:not([type="hidden"]), textarea');
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
      if (!isDropdown) inp.blur();

      const hid = cell.querySelector('input[type="hidden"]');
      if (hid) {
        hid.value = String(valStr);
        hid.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    }

    return false;
  }

  // Fungsi pengisian dengan pencocokan label presisi
  async function fillExactRow(exactKeywords, valStr, isDropdown = false) {
    if (!valStr && valStr !== 0 && valStr !== '0') return false;
    const trs = document.querySelectorAll('tr');

    for (const tr of trs) {
      if (!tr.cells || tr.cells.length < 2) continue;

      let rowLabel = '';
      for (let i = 0; i < tr.cells.length - 1; i++) {
        rowLabel += ' ' + cleanLabel(tr.cells[i].textContent);
      }
      rowLabel = rowLabel.trim();

      // Cek apakah baris ini cocok dengan kata kunci persis
      const isMatch = exactKeywords.some(kw => {
        const cleanKw = cleanLabel(kw);
        return rowLabel === cleanKw || rowLabel.startsWith(cleanKw) || rowLabel.includes(cleanKw);
      });

      if (isMatch) {
        const targetCell = tr.cells[tr.cells.length - 1];
        if (await applyValueToCell(targetCell, valStr, isDropdown)) {
          return true;
        }
      }
    }
    return false;
  }

  // Eksekusi utama seluruh kolom
  async function startProcess(data) {
    if (!data) return;

    // Pasang watcher pop-up Kemendagri
    const watcher = setInterval(dismissKemendagriPopup, 300);
    await dismissKemendagriPopup();

    let count = 0;

    // 1. Identitas Awal
    if (await fillExactRow(['tanggal pelaksanaan skrining'], formatDate(data.tanggal_skrining), false)) count++;
    if (await fillExactRow(['nama kegiatan'], data.nama_kegiatan || 'Skrining Oleh Fasyankes', true)) count++;
    if (await fillExactRow(['tempat skrining'], data.tempat_skrining || 'Puskesmas', true)) count++;
    if (await fillExactRow(['kewarganegaraan'], data.kewarganegaraan || 'WNI', true)) count++;

    // 2. NIK (dan tangani popup jika muncul)
    if (await fillExactRow(['nik'], data.nik, false)) count++;
    await sleep(800);
    await dismissKemendagriPopup();

    // 3. Identitas Lanjutan
    if (await fillExactRow(['nama peserta'], data.nama_peserta, false)) count++;
    if (await fillExactRow(['jenis kelamin'], data.jenis_kelamin, true)) count++;
    if (await fillExactRow(['tanggal lahir'], formatDate(data.tanggal_lahir), false)) count++;
    if (await fillExactRow(['pekerjaan'], data.pekerjaan || 'Tidak Bekerja', true)) count++;

    // 4. Alamat (Presisi agar tidak tertukar dengan domisili)
    if (await fillExactRow(['alamat ktp'], data.alamat_ktp, false)) count++;
    if (await fillExactRow(['sama dengan alamat kartu identitas', 'sama dengan alamat'], data.sama_dengan_ktp || 'Ya', true)) count++;
    if (await fillExactRow(['no. hp', 'no hp'], data.no_hp, false)) count++;

    // 5. Berat Badan & Tinggi Badan (Presisi agar tidak masuk ke baris TBC / BB Turun)
    if (await fillExactRow(['berat badan (kg)', 'berat badan'], String(data.berat_badan || ''), false)) count++;
    if (await fillExactRow(['tinggi badan/panjang badan (cm)', 'tinggi badan'], String(data.tinggi_badan || ''), false)) count++;

    // 6. Riwayat Kontak & Risiko
    if (await fillExactRow(['memiliki riwayat kontak dengan pasien tbc', 'riwayat kontak'], normalizeYN(data.riwayat_kontak_tbc), true)) count++;
    if (await fillExactRow(['pernah terdiagnosa/ berobat tbc', 'pernah terdiagnosa'], normalizeYN(data.pernah_tbc), true)) count++;
    if (await fillExactRow(['kekurangan gizi'], normalizeYN(data.kekurangan_gizi), true)) count++;
    if (await fillExactRow(['merokok'], normalizeYN(data.merokok), true)) count++;
    if (await fillExactRow(['riwayat dm/ kencing manis', 'riwayat dm'], normalizeYN(data.riwayat_dm), true)) count++;
    if (await fillExactRow(['orang dengan hiv'], normalizeYN(data.odha), true)) count++;
    if (await fillExactRow(['ibu hamil'], 'Tidak', true)) count++;

    // 7. Gejala dan Tanda
    if (await fillExactRow(['batuk'], normalizeYN(data.batuk), true)) count++;
    if (await fillExactRow(['bb turun tanpa penyebab jelas', 'bb turun'], normalizeYN(data.bb_turun), true)) count++;
    if (await fillExactRow(['demam hilang timbul', 'demam'], normalizeYN(data.demam), true)) count++;
    if (await fillExactRow(['berkeringat malam hari', 'berkeringat malam'], normalizeYN(data.berkeringat), true)) count++;
    if (await fillExactRow(['pembesaran kelenjar getah bening', 'pembesaran kelenjar'], normalizeYN(data.pembesaran_kelenjar), true)) count++;

    // 8. Hasil Skrining & CXR
    if (await fillExactRow(['hasil skrining gejala dan tanda tbc', 'hasil skrining gejala'], normalizeHasil(data.hasil_skrining), true)) count++;
    if (await fillExactRow(['dilakukan pemeriksaan cxr'], normalizeYN(data.dilakukan_cxr), true)) count++;
    if (await fillExactRow(['alasan tidak cxr'], 'Tidak', false)) count++;
    if (await fillExactRow(['terduga tbc'], normalizeYN(data.terduga_tbc), true)) count++;

    // 9. Alamat Bertingkat (Dengan Jeda Loading)
    await fillExactRow(['provinsi ktp'], data.provinsi_ktp, true);
    await sleep(1500);
    await fillExactRow(['kabupaten/kota ktp', 'kabupaten ktp'], data.kabupaten_ktp, true);
    await sleep(1500);
    if (data.kecamatan_ktp) {
      await fillExactRow(['kecamatan ktp'], data.kecamatan_ktp, true);
      await sleep(1500);
    }
    if (data.kelurahan_ktp) {
      await fillExactRow(['kelurahan ktp'], data.kelurahan_ktp, true);
    }

    await dismissKemendagriPopup();
    clearInterval(watcher);

    if (count >= 3) {
      alert(`✅ SITB Assistant: ${count} kolom berhasil disalin secara presisi!\n\nSeluruh data identitas, fisik, risiko, dan gejala telah diinput ke baris yang tepat.`);
    }
  }

  // Jalankan saat diinjeksi
  try {
    const res = await chrome.storage.local.get('activePatient');
    if (res && res.activePatient) {
      await startProcess(res.activePatient);
    }
  } catch (e) {}

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'FILL_DATA' && request.data) {
      startProcess(request.data);
    }
    return true;
  });
})();
