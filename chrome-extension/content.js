// Listen for messages dari popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FILL_DATA') {
    const data = request.data;
    
    // === OTOMATISASI PINTAR (MEMBACA LABEL VISUAL) ===
    const smartFill = (labelKeywords, nameKeywords, value, isDropdown = false) => {
      if (!value) return false;
      
      let targetInput = null;

      // Strategi 1: Cari berdasarkan Teks Label yang terlihat di layar (Sangat ampuh untuk SITB ExtJS)
      const elementsWithText = Array.from(document.querySelectorAll('label, div, span, td'));
      for (const el of elementsWithText) {
        // Abaikan kontainer besar
        if (el.childElementCount > 3) continue;
        
        const text = el.textContent.toLowerCase();
        const matchesLabel = labelKeywords.some(kw => text.includes(kw));
        
        if (matchesLabel) {
          // Cari input di dalam label (jika ada 'for')
          if (el.tagName === 'LABEL' && el.htmlFor) {
            targetInput = document.getElementById(el.htmlFor);
          }
          
          // Cari input di kontainer yang sama (parent)
          if (!targetInput) {
            let parent = el.parentElement;
            let depth = 0;
            while (parent && depth < 3) {
              if (parent.tagName === 'BODY' || parent.tagName === 'FORM') break;
              const input = parent.querySelector('input:not([type="hidden"]), select, textarea');
              if (input && input.type !== 'button' && input.type !== 'submit') {
                targetInput = input;
                break;
              }
              parent = parent.parentElement;
              depth++;
            }
          }
          
          // Cari di elemen sebelahnya (seperti tabel <td>Label</td> <td><input></td>)
          if (!targetInput) {
            let next = el.nextElementSibling || (el.parentElement ? el.parentElement.nextElementSibling : null);
            if (next) {
              const input = next.querySelector('input:not([type="hidden"]), select, textarea');
              if (input) targetInput = input;
            }
          }
        }
        if (targetInput) break; // Ketemu!
      }

      // Strategi 2: Fallback cari dari name / id (Cara lama)
      if (!targetInput) {
        const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
        for (const input of inputs) {
          const name = (input.name || '').toLowerCase();
          const id = (input.id || '').toLowerCase();
          if (nameKeywords.some(kw => name.includes(kw) || id.includes(kw))) {
            targetInput = input;
            break;
          }
        }
      }

      // EKSEKUSI PENGISIAN
      if (targetInput) {
        // Lewati jika sudah terisi (mencegah salah tindih)
        if (targetInput.value !== '' && targetInput.value !== '-- Pilih --' && targetInput.value !== 'Pilih') return false;

        if (targetInput.tagName === 'SELECT') {
          for (let i = 0; i < targetInput.options.length; i++) {
            if (targetInput.options[i].text.toLowerCase().includes(value.toLowerCase()) || 
                targetInput.options[i].value.toLowerCase() === value.toLowerCase()) {
              targetInput.selectedIndex = i;
              targetInput.dispatchEvent(new Event('change', { bubbles: true }));
              return true;
            }
          }
        } else {
          // Input Teks / Custom Combo Box SITB
          targetInput.focus();
          targetInput.value = value;
          targetInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          if (isDropdown) {
            // Beri waktu SITB untuk memfilter list, lalu tekan Enter (TANPA tekan bawah agar tidak meleset)
            setTimeout(() => {
              targetInput.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', keyCode: 13 }));
              targetInput.dispatchEvent(new Event('change', { bubbles: true }));
              targetInput.blur();
            }, 600);
          } else {
            targetInput.dispatchEvent(new Event('change', { bubbles: true }));
            targetInput.blur();
          }
          return true;
        }
      }
      return false;
    };

    // --- PEMETAAN SELURUH KOLOM SITB KEMENKES ---
    // Format: smartFill([Kata Kunci Label], [Kata Kunci Name], data.field, isDropdown)

    // 1. IDENTITAS
    smartFill(['tanggal pelaksanaan', 'tanggal skrining'], ['tgl_skrining'], data.tanggal_skrining, false);
    smartFill(['tempat skrining'], ['tempat'], data.tempat_skrining, true);
    smartFill(['kewarganegaraan'], ['warga'], data.kewarganegaraan, true);
    smartFill(['nik'], ['nik'], data.nik, false);
    smartFill(['nama peserta'], ['nama'], data.nama_peserta, false);
    smartFill(['jenis kelamin'], ['kelamin', 'jk'], data.jenis_kelamin, true);
    smartFill(['tanggal lahir'], ['tgl_lahir', 'lahir'], data.tanggal_lahir, false);
    smartFill(['pekerjaan'], ['kerja'], data.pekerjaan, true);

    // 2. ALAMAT
    smartFill(['alamat ktp'], ['alamat'], data.alamat_ktp, false);
    smartFill(['no. hp', 'no hp', 'telepon'], ['hp', 'telp'], data.no_hp, false);
    
    // 3. PEMERIKSAAN BB & TB
    smartFill(['berat badan'], ['berat', 'bb', 'weight', 'kg'], data.berat_badan, false);
    smartFill(['tinggi badan', 'panjang badan'], ['tinggi', 'tb', 'height', 'cm'], data.tinggi_badan, false);

    // 4. RIWAYAT KONTAK
    smartFill(['riwayat kontak'], ['kontak'], data.riwayat_kontak_tbc, true);

    // 5. FAKTOR RISIKO
    smartFill(['pernah terdiagnosa', 'berobat tbc'], ['pernah_tbc', 'berobat'], data.pernah_tbc, true);
    smartFill(['kekurangan gizi'], ['gizi'], data.kekurangan_gizi, true);
    smartFill(['merokok'], ['rokok'], data.merokok, true);
    smartFill(['riwayat dm', 'kencing manis'], ['dm', 'manis'], data.riwayat_dm, true);
    smartFill(['orang dengan hiv'], ['hiv', 'odha'], data.odha, true);

    // 6. SKRINING GEJALA
    smartFill(['batuk'], ['batuk'], data.batuk, true);
    smartFill(['bb turun', 'nafsu makan turun'], ['bb_turun', 'nafsu'], data.bb_turun, true);
    smartFill(['demam hilang'], ['demam'], data.demam, true);
    smartFill(['berkeringat malam'], ['keringat'], data.berkeringat, true);
    smartFill(['pembesaran kelenjar'], ['kelenjar', 'getah'], data.pembesaran_kelenjar, true);

    // 7. HASIL SKRINING & CXR
    smartFill(['hasil skrining gejala'], ['hasil'], data.hasil_skrining, true);
    smartFill(['dilakukan pemeriksaan cxr'], ['cxr', 'xray'], data.dilakukan_cxr, true);
    smartFill(['terduga tbc'], ['terduga'], data.terduga_tbc, true);

    // 8. ALAMAT (Dengan Jeda Bertahap Agar Tidak Meleset)
    smartFill(['provinsi ktp'], ['provinsi'], data.provinsi_ktp, true);
    
    // Tunggu 1.5 detik agar kabupaten dari provinsi tersebut muncul
    setTimeout(() => {
      smartFill(['kabupaten/kota', 'kabupaten'], ['kabupaten', 'kota'], data.kabupaten_ktp, true);
      
      // Jika butuh isi kecamatan, tunggu 1.5 detik lagi
      if(data.kecamatan_ktp) {
        setTimeout(() => smartFill(['kecamatan ktp'], ['kecamatan'], data.kecamatan_ktp, true), 1500);
      }
    }, 1500);

    if (window.top === window.self) {
      alert('✅ SITB Assistant: Proses pengisian berjalan!\n\nMohon diamkan mouse selama 2-3 detik agar alamat (Provinsi & Kabupaten) tereksekusi dengan benar.');
    }
  }
});
