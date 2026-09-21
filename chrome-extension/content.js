// Listen for messages dari popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FILL_DATA') {
    const data = request.data;
    
    // === HELPER PENGISIAN ===
    const smartFill = (keywords, value, isDropdown = false) => {
      if (!value) return false;
      
      // Ambil SEMUA elemen, termasuk yang disembunyikan (hidden) oleh SITB
      const elements = document.querySelectorAll('input, select, textarea');
      
      for (let el of elements) {
        const name = (el.name || '').toLowerCase();
        const id = (el.id || '').toLowerCase();
        const placeholder = (el.placeholder || '').toLowerCase();
        
        if (keywords.some(kw => name.includes(kw) || id.includes(kw) || placeholder.includes(kw))) {
          
          // Jika ini adalah kolom 'hidden' (disembunyikan oleh sistem ExtJS SITB),
          // maka kita harus mencari kolom visualnya (yang terlihat di layar) di sebelahnya
          if (el.type === 'hidden') {
            const visibleSibling = el.parentElement.querySelector('input:not([type="hidden"]), select');
            if (visibleSibling) {
              el = visibleSibling; // Pindahkan target ke kolom yang terlihat
            } else {
              continue; // Kalau tidak ada, lewati
            }
          }

          // Lewati jika kolom sudah terisi (jangan ditimpa)
          if (el.value && el.value !== '' && el.value !== '-- Pilih --' && el.value !== 'Pilih') {
             continue; 
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
            // Input Text biasa atau Custom Dropdown SITB
            el.focus();
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            
            if (isDropdown) {
              // Beri jeda 600ms untuk loading, lalu Enter (TANPA tekan bawah agar tidak meleset)
              setTimeout(() => {
                el.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', keyCode: 13 }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                el.blur();
              }, 600);
            } else {
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.blur();
            }
            return true;
          }
        }
      }
      return false;
    };

    // --- PEMETAAN KOLOM (Menggunakan nama internal SITB) ---
    
    // Identitas
    smartFill(['tgl_skrining', 'tanggalskrining', 'pelaksanaan'], data.tanggal_skrining, false);
    smartFill(['tempat'], data.tempat_skrining, true);
    smartFill(['warga', 'kewarganegaraan'], data.kewarganegaraan, true);
    smartFill(['nik', 'no_identitas'], data.nik, false);
    smartFill(['nama', 'nm_pasien', 'namapasien', 'peserta'], data.nama_peserta, false);
    smartFill(['kelamin', 'jk', 'gender'], data.jenis_kelamin, true);
    smartFill(['tgl_lahir', 'tanggallahir', 'tanggal_lahir'], data.tanggal_lahir, false);
    smartFill(['kerja', 'pekerjaan'], data.pekerjaan, true);
    
    // Alamat & Kontak
    smartFill(['alamat'], data.alamat_ktp, false);
    smartFill(['hp', 'telp', 'telepon'], data.no_hp, false);
    
    // Fisik
    smartFill(['berat', 'bb', 'weight', 'kg'], data.berat_badan, false);
    smartFill(['tinggi', 'tb', 'height', 'cm', 'panjang'], data.tinggi_badan, false);

    // Riwayat
    smartFill(['kontak', 'riwayat_kontak'], data.riwayat_kontak_tbc, true);
    smartFill(['pernah_tbc', 'berobat', 'diagnosa'], data.pernah_tbc, true);
    smartFill(['gizi', 'kekurangan'], data.kekurangan_gizi, true);
    smartFill(['rokok', 'merokok'], data.merokok, true);
    smartFill(['dm', 'manis', 'kencing'], data.riwayat_dm, true);
    smartFill(['hiv', 'odha'], data.odha, true);

    // Gejala
    smartFill(['batuk'], data.batuk, true);
    smartFill(['bb_turun', 'nafsu'], data.bb_turun, true);
    smartFill(['demam'], data.demam, true);
    smartFill(['keringat', 'malam'], data.berkeringat, true);
    smartFill(['kelenjar', 'getah', 'pembesaran'], data.pembesaran_kelenjar, true);

    // Hasil
    smartFill(['hasil_skrining', 'hasil'], data.hasil_skrining, true);
    smartFill(['cxr', 'xray'], data.dilakukan_cxr, true);
    smartFill(['terduga'], data.terduga_tbc, true);

    // Alamat Dropdown (Berjenjang)
    smartFill(['provinsi', 'propinsi'], data.provinsi_ktp, true);
    setTimeout(() => smartFill(['kabupaten', 'kota', 'kab'], data.kabupaten_ktp, true), 1500);
    
    if (data.kecamatan_ktp) {
      setTimeout(() => smartFill(['kecamatan', 'kec'], data.kecamatan_ktp, true), 3000);
    }
    if (data.kelurahan_ktp) {
      setTimeout(() => smartFill(['kelurahan', 'desa', 'kel'], data.kelurahan_ktp, true), 4500);
    }

    if (window.top === window.self) {
      alert('✅ SITB Assistant: Memulai pengisian form.\n\nMohon diamkan mouse selama 2-3 detik agar alamat (Provinsi & Kabupaten) tereksekusi dengan benar.');
    }
  }
});
