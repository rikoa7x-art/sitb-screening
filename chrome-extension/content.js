// Listen for messages dari popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FILL_DATA') {
    const data = request.data;
    
    // Fungsi pintar untuk membaca teks/label di sebelah sebuah kotak input
    const getLabelTextForInput = (input) => {
      let text = '';
      
      // 1. Cek bungkus bawaan ExtJS (SITB sering pakai ini)
      const xFormItem = input.closest('.x-form-item');
      if (xFormItem) {
        const lbl = xFormItem.querySelector('.x-form-item-label');
        if (lbl) text += lbl.textContent + ' ';
      }
      
      // 2. Cek baris tabel (<tr>) jika form menggunakan tabel
      const tr = input.closest('tr');
      if (tr) {
        const clone = tr.cloneNode(true);
        // Hapus elemen input dari bayangan tabel agar kita cuma dapat teks labelnya
        clone.querySelectorAll('input, select, textarea').forEach(e => e.remove());
        text += clone.textContent + ' ';
      }
      
      // 3. Cek tag <label> resmi
      if (input.id) {
        const lbl = document.querySelector(`label[for="${input.id}"]`);
        if (lbl) text += lbl.textContent + ' ';
      }

      return text.toLowerCase();
    };

    // Fungsi utama pencari dan pengisi form
    const smartFill = (labelKeywords, nameKeywords, value, isDropdown = false) => {
      if (!value) return false;
      
      // Ambil seluruh kotak input yang terlihat di layar
      const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
      
      for (const input of inputs) {
        if (input.disabled) continue; // Lewati jika kotak dimatikan (disabled)
        
        const name = (input.name || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        const labelText = getLabelTextForInput(input);
        
        // Cocokkan teks label di sebelah kotak, ATAU nama tersembunyi kotaknya
        if (labelKeywords.some(kw => labelText.includes(kw)) || 
            nameKeywords.some(kw => name.includes(kw) || id.includes(kw))) {
          
          // Lewati jika sudah terisi (jangan ditimpa)
          if (input.value && input.value !== '' && input.value !== '-- Pilih --' && input.value !== 'Pilih') {
             continue; 
          }

          if (input.tagName === 'SELECT') {
            for (let i = 0; i < input.options.length; i++) {
              if (input.options[i].text.toLowerCase().includes(value.toLowerCase()) || 
                  input.options[i].value.toLowerCase() === value.toLowerCase()) {
                input.selectedIndex = i;
                input.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
              }
            }
          } else {
            // Input Text biasa atau Custom Dropdown SITB
            input.focus();
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            
            if (isDropdown) {
              // Simulasikan menekan tombol Enter pada ExtJS combobox
              setTimeout(() => {
                input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter', keyCode: 13, which: 13 }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.blur();
              }, 800);
            } else {
              input.dispatchEvent(new Event('change', { bubbles: true }));
              input.blur();
            }
            return true; // Berhasil diisi, berhenti mencari kolom untuk data ini
          }
        }
      }
      return false;
    };

    // --- PEMETAAN KOLOM (Berdasarkan tulisan yang terlihat di layar SITB) ---
    
    // Identitas
    smartFill(['tanggal pelaksanaan', 'tanggal skrining'], ['tgl_skrining'], data.tanggal_skrining, false);
    smartFill(['tempat skrining'], ['tempat'], data.tempat_skrining, true);
    smartFill(['kewarganegaraan'], ['warga'], data.kewarganegaraan, true);
    smartFill(['nik'], ['nik'], data.nik, false);
    smartFill(['nama peserta'], ['nama'], data.nama_peserta, false);
    smartFill(['jenis kelamin'], ['kelamin', 'jk'], data.jenis_kelamin, true);
    smartFill(['tanggal lahir'], ['tgl_lahir', 'lahir'], data.tanggal_lahir, false);
    smartFill(['pekerjaan'], ['kerja'], data.pekerjaan, true);
    
    // Alamat & Kontak
    smartFill(['alamat ktp', 'alamat'], ['alamat'], data.alamat_ktp, false);
    smartFill(['no. hp', 'no hp', 'telepon'], ['hp', 'telp'], data.no_hp, false);
    
    // Fisik
    smartFill(['berat badan'], ['berat', 'bb'], data.berat_badan, false);
    smartFill(['tinggi badan', 'panjang badan'], ['tinggi', 'tb'], data.tinggi_badan, false);

    // Riwayat
    smartFill(['riwayat kontak'], ['kontak'], data.riwayat_kontak_tbc, true);
    smartFill(['pernah terdiagnosa', 'berobat tbc'], ['pernah_tbc'], data.pernah_tbc, true);
    smartFill(['kekurangan gizi'], ['gizi'], data.kekurangan_gizi, true);
    smartFill(['merokok'], ['rokok'], data.merokok, true);
    smartFill(['riwayat dm', 'kencing manis'], ['dm', 'manis'], data.riwayat_dm, true);
    smartFill(['orang dengan hiv'], ['hiv', 'odha'], data.odha, true);

    // Gejala
    smartFill(['batuk'], ['batuk'], data.batuk, true);
    smartFill(['bb turun', 'nafsu makan turun'], ['bb_turun', 'nafsu'], data.bb_turun, true);
    smartFill(['demam hilang'], ['demam'], data.demam, true);
    smartFill(['berkeringat malam'], ['keringat'], data.berkeringat, true);
    smartFill(['pembesaran kelenjar', 'getah bening'], ['kelenjar', 'getah'], data.pembesaran_kelenjar, true);

    // Hasil
    smartFill(['hasil skrining gejala'], ['hasil_skrining'], data.hasil_skrining, true);
    smartFill(['dilakukan pemeriksaan cxr'], ['cxr', 'xray'], data.dilakukan_cxr, true);
    smartFill(['terduga tbc'], ['terduga'], data.terduga_tbc, true);
    
    // Bonus: Otomatis pilih alasan tidak CXR jika cxr = Tidak
    if(data.dilakukan_cxr === 'Tidak') {
      smartFill(['alasan tidak cxr'], [], 'Tidak', true);
    }

    // Alamat Dropdown (Berjenjang, waktu tunggu diperpanjang agar lebih stabil)
    smartFill(['provinsi ktp'], ['provinsi'], data.provinsi_ktp, true);
    setTimeout(() => smartFill(['kabupaten/kota'], ['kabupaten', 'kota'], data.kabupaten_ktp, true), 1500);
    
    if (data.kecamatan_ktp) {
      setTimeout(() => smartFill(['kecamatan ktp'], ['kecamatan'], data.kecamatan_ktp, true), 3000);
    }
    if (data.kelurahan_ktp) {
      setTimeout(() => smartFill(['kelurahan ktp'], ['kelurahan', 'desa'], data.kelurahan_ktp, true), 4500);
    }

    if (window.top === window.self) {
      alert('✅ SITB Assistant: Memulai pengisian cerdas!\n\nMohon diamkan mouse selama 4-5 detik agar seluruh alamat dan dropdown tereksekusi dengan benar.');
    }
  }
});
