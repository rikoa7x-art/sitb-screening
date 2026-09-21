// Listen for messages dari popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FILL_DATA') {
    const data = request.data;
    
    // Helper untuk mencari input berdasarkan name, id, atau sebagian string
    const findAndFill = (keywords, value) => {
      if (!value) return;
      
      // Kumpulkan semua input, textarea
      const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea');
      
      for (const input of inputs) {
        const name = (input.name || '').toLowerCase();
        const id = (input.id || '').toLowerCase();
        
        // Cek apakah name/id mengandung salah satu keyword
        const isMatch = keywords.some(kw => name.includes(kw) || id.includes(kw));
        
        if (isMatch && input.value === '') {
          input.focus();
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.blur();
          return true; // Stop setelah ketemu 1 yang cocok
        }
      }
      return false;
    };

    // --- PEMETAAN KOLOM SITB ---
    
    // Identitas
    findAndFill(['nik', 'no_identitas'], data.nik);
    findAndFill(['nama', 'nm_pasien', 'namapasien'], data.nama_peserta);
    findAndFill(['tgl_lahir', 'tanggallahir', 'tanggal_lahir'], data.tanggal_lahir);
    findAndFill(['no_hp', 'nohp', 'telepon', 'telp'], data.no_hp);
    
    // Alamat
    findAndFill(['alamat'], data.alamat_ktp);
    
    // Pemeriksaan Fisik
    findAndFill(['berat', 'bb'], data.berat_badan);
    findAndFill(['tinggi', 'tb'], data.tinggi_badan);
    findAndFill(['tgl_skrining', 'tanggalskrining'], data.tanggal_skrining);

    // Karena script ini sekarang berjalan di semua Iframe (allFrames: true),
    // kita hanya munculkan alert dari frame utama (top window) agar tidak muncul berulang kali.
    if (window.top === window.self) {
      alert('✅ SITB Assistant: Proses pengisian selesai!\n\nPastikan untuk mengecek ulang kolom dropdown seperti Jenis Kelamin, Provinsi, dll (karena SITB menggunakan dropdown khusus).');
    }
  }
});
