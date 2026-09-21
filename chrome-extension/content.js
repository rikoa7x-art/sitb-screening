// Listen for messages dari popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FILL_DATA') {
    const data = request.data;
    
    // Helper untuk mencari input text
    const findAndFillText = (keywords, value) => {
      if (!value) return false;
      const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
      for (const input of inputs) {
        const name = (input.name || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        
        if (keywords.some(kw => name.includes(kw) || id.includes(kw)) && input.value === '') {
          input.focus();
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.blur();
          return true;
        }
      }
      return false;
    };

    // Helper khusus untuk Dropdown / Combo Box
    const findAndSelect = (keywords, value) => {
      if (!value) return false;
      
      // Cari elemen select ATAU input text (karena SITB kadang pakai input text yang bertingkah seperti dropdown ExtJS)
      const elements = document.querySelectorAll('select, input:not([type="hidden"])');
      
      for (const el of elements) {
        const name = (el.name || '').toLowerCase();
        const id = (el.id || '').toLowerCase();
        
        if (keywords.some(kw => name.includes(kw) || id.includes(kw))) {
          if (el.tagName === 'SELECT') {
            // Jika ini elemen select standar
            for (let i = 0; i < el.options.length; i++) {
              if (el.options[i].text.toLowerCase().includes(value.toLowerCase()) || 
                  el.options[i].value.toLowerCase() === value.toLowerCase()) {
                el.selectedIndex = i;
                el.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
          } else {
            // Jika ini custom combo box ExtJS
            el.focus();
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Simulasikan menekan tombol panah bawah / enter agar listnya bereaksi
            el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown', keyCode: 40 }));
            setTimeout(() => {
              el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', keyCode: 13 }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.blur();
            }, 100);
            return true;
          }
        }
      }
      return false;
    };

    // --- PEMETAAN KOLOM SITB ---
    
    // Teks
    findAndFillText(['nik', 'no_identitas'], data.nik);
    findAndFillText(['nama', 'nm_pasien', 'namapasien'], data.nama_peserta);
    findAndFillText(['tgl_lahir', 'tanggallahir', 'tanggal_lahir'], data.tanggal_lahir);
    findAndFillText(['no_hp', 'nohp', 'telepon', 'telp'], data.no_hp);
    findAndFillText(['alamat'], data.alamat_ktp);
    findAndFillText(['berat', 'bb'], data.berat_badan);
    findAndFillText(['tinggi', 'tb'], data.tinggi_badan);
    findAndFillText(['tgl_skrining', 'tanggalskrining'], data.tanggal_skrining);

    // Dropdown / Combo Box
    findAndSelect(['kelamin', 'jk', 'gender'], data.jenis_kelamin);
    findAndSelect(['kerja', 'pekerjaan'], data.pekerjaan);
    findAndSelect(['warga', 'kewarganegaraan', 'wni'], data.kewarganegaraan);
    findAndSelect(['provinsi', 'propinsi'], data.provinsi_ktp);
    // Timeout untuk kabupaten, karena biasanya web pemerintah butuh waktu loading kabupaten setelah provinsi dipilih
    setTimeout(() => {
      findAndSelect(['kabupaten', 'kota', 'kab'], data.kabupaten_ktp);
    }, 1000);

    if (window.top === window.self) {
      alert('✅ SITB Assistant: Proses pengisian selesai!\n\nUntuk dropdown (seperti Jenis Kelamin/Pekerjaan) telah dicoba diisi otomatis. Jika ada yang masih kosong, mohon klik manual.');
    }
  }
});
