// Listen for messages dari popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FILL_DATA') {
    const data = request.data;
    
    console.log("SITB Assistant: Memulai auto-fill data", data);

    // Helper untuk set value di form
    const setValue = (selector, value) => {
      // Cari elemen dengan selector yang diberikan
      const el = document.querySelector(selector);
      if (el) {
        // Tulis value
        el.value = value;
        // Trigger event supaya website mendeteksi ada ketikan (React/Vue/Angular butuh ini)
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    const setRadio = (name, valueMatches) => {
      const radios = document.querySelectorAll(`input[type="radio"][name="${name}"]`);
      for (const r of radios) {
        // Cari radio yang text atau valuenya mirip dengan jawaban
        if (valueMatches.some(v => r.value.toLowerCase().includes(v.toLowerCase()) || r.nextSibling?.textContent.toLowerCase().includes(v.toLowerCase()))) {
          r.checked = true;
          r.dispatchEvent(new Event('change', { bubbles: true }));
          r.click();
          break;
        }
      }
    };

    /**
     * CATATAN UNTUK PETUGAS PUSKESMAS:
     * Karena struktur HTML SITB Kemenkes bisa berubah-ubah, 
     * Anda bisa menyesuaikan selector CSS di bawah ini jika ada yang tidak terisi.
     * Gunakan inspect element di Chrome untuk mencari "name" atau "id" dari kolom SITB.
     */

    // Identitas
    setValue('input[name="nik"], input[id="nik"], input[placeholder*="NIK"]', data.nik);
    setValue('input[name="nama"], input[id="nama_lengkap"], input[placeholder*="Nama"]', data.nama_peserta);
    setValue('input[name="tempat_lahir"]', data.tempat_lahir || ''); 
    setValue('input[name="tanggal_lahir"], input[type="date"]', data.tanggal_lahir);
    setValue('input[name="no_hp"], input[name="telepon"]', data.no_hp);
    
    // Alamat
    setValue('textarea[name="alamat"], input[name="alamat"]', data.alamat_ktp);
    
    // Pemeriksaan Fisik
    setValue('input[name="berat_badan"], input[id="bb"]', data.berat_badan);
    setValue('input[name="tinggi_badan"], input[id="tb"]', data.tinggi_badan);
    
    // Faktor Risiko & Gejala (SITB mungkin pakai radio button atau dropdown)
    // Contoh untuk dropdown/select
    setValue('select[name="pekerjaan"]', data.pekerjaan);
    
    // Alert bahwa proses ketik selesai
    alert('✅ SITB Assistant: Data pasien berhasil disalin ke form.\n\nSilakan periksa kembali isiannya sebelum menekan tombol Simpan.');
  }
});
