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
        const placeholder = (input.placeholder || '').toLowerCase();
        
        if (keywords.some(kw => name.includes(kw) || id.includes(kw) || placeholder.includes(kw)) && input.value === '') {
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
      
      const elements = document.querySelectorAll('select, input:not([type="hidden"])');
      
      for (const el of elements) {
        const name = (el.name || '').toLowerCase();
        const id = (el.id || '').toLowerCase();
        
        if (keywords.some(kw => name.includes(kw) || id.includes(kw))) {
          // Lewati jika sudah terisi untuk mencegah override salah
          if (el.value !== '' && el.value !== '-- Pilih --') {
             continue; // Cari elemen lain yang namanya mirip tapi masih kosong
          }

          if (el.tagName === 'SELECT') {
            for (let i = 0; i < el.options.length; i++) {
              if (el.options[i].text.toLowerCase().includes(value.toLowerCase()) || 
                  el.options[i].value.toLowerCase() === value.toLowerCase()) {
                el.selectedIndex = i;
                el.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
          } else {
            // Custom ExtJS combobox
            el.focus();
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Jeda 800ms agar dropdown SITB sempat loading hasil pencarian
            setTimeout(() => {
              el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown', keyCode: 40 }));
              el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', keyCode: 13 }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.blur();
            }, 800);
            return true;
          }
        }
      }
      return false;
    };

    // --- PEMETAAN KOLOM SITB KEMENKES ---
    // Diurutkan berdasarkan screenshot
    
    // 1. Identitas
    findAndFillText(['tgl_skrining', 'tanggalskrining', 'pelaksanaan'], data.tanggal_skrining);
    findAndSelect(['tempat', 'lokasi'], data.tempat_skrining);
    findAndSelect(['warga', 'kewarganegaraan', 'wni'], data.kewarganegaraan);
    findAndFillText(['nik', 'no_identitas'], data.nik);
    findAndFillText(['nama', 'nm_pasien', 'namapasien', 'peserta'], data.nama_peserta);
    findAndSelect(['kelamin', 'jk', 'gender'], data.jenis_kelamin);
    findAndFillText(['tgl_lahir', 'tanggallahir', 'tanggal_lahir'], data.tanggal_lahir);
    findAndSelect(['kerja', 'pekerjaan'], data.pekerjaan);
    
    // 2. Alamat & Kontak
    findAndFillText(['alamat'], data.alamat_ktp);
    findAndFillText(['no_hp', 'nohp', 'telepon', 'telp', 'hp'], data.no_hp);

    // 3. Pemeriksaan BB & TB (Sering pakai id/name aneh seperti 'kg' atau 'cm' di ExtJS)
    findAndFillText(['berat', 'bb', 'kg', 'weight'], data.berat_badan);
    findAndFillText(['tinggi', 'tb', 'cm', 'height', 'panjang'], data.tinggi_badan);

    // 4. Riwayat Kontak
    findAndSelect(['kontak', 'riwayat_kontak'], data.riwayat_kontak_tbc);

    // 5. Faktor Risiko
    findAndSelect(['pernah', 'terdiagnosa', 'berobat'], data.pernah_tbc);
    findAndSelect(['gizi', 'kekurangan'], data.kekurangan_gizi);
    findAndSelect(['rokok', 'merokok'], data.merokok);
    findAndSelect(['dm', 'kencing_manis', 'manis'], data.riwayat_dm);
    findAndSelect(['hiv', 'odha'], data.odha);

    // 6. Skrining Gejala dan Tanda
    findAndSelect(['batuk'], data.batuk);
    findAndSelect(['bb_turun', 'turun', 'nafsu'], data.bb_turun);
    findAndSelect(['demam', 'hilang_timbul'], data.demam);
    findAndSelect(['keringat', 'malam'], data.berkeringat);
    findAndSelect(['kelenjar', 'getah', 'bening', 'pembesaran'], data.pembesaran_kelenjar);

    // 7. Hasil Skrining & CXR
    findAndSelect(['hasil_skrining', 'hasil', 'gejala_dan_tanda'], data.hasil_skrining);
    findAndSelect(['cxr', 'xray', 'x-ray', 'pemeriksaan_cxr'], data.dilakukan_cxr);
    findAndSelect(['terduga'], data.terduga_tbc);

    // 8. Alamat Bertingkat (Butuh Jeda Loading AJAX yang lama)
    // Dimulai segera
    findAndSelect(['provinsi', 'propinsi'], data.provinsi_ktp);
    
    // Menunggu 2 detik agar provinsi selesai load, baru pilih Kabupaten
    setTimeout(() => {
      findAndSelect(['kabupaten', 'kota', 'kab'], data.kabupaten_ktp);
      
      // Jika ada kecamatan, tunggu lagi 2 detik setelah kabupaten
      if (data.kecamatan_ktp) {
        setTimeout(() => {
          findAndSelect(['kecamatan', 'kec'], data.kecamatan_ktp);
          
          if (data.kelurahan_ktp) {
            setTimeout(() => {
              findAndSelect(['kelurahan', 'desa', 'kel'], data.kelurahan_ktp);
            }, 2000);
          }
        }, 2000);
      }
    }, 2000);

    if (window.top === window.self) {
      alert('✅ SITB Assistant: Memulai pengisian form.\n\nMohon tunggu sekitar 5 detik sampai kolom alamat (Provinsi/Kabupaten) selesai dimuat otomatis, lalu periksa kembali seluruh isian!');
    }
  }
});
