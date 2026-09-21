// DOM Elements
const listEl = document.getElementById('list');
const loadingEl = document.getElementById('loading');

// Fetch data dari Supabase
async function fetchData() {
  try {
    const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/screenings?status=eq.approved&select=*`, {
      headers: {
        'apikey': CONFIG.SUPABASE_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`
      }
    });
    
    if (!res.ok) throw new Error('Gagal memuat data');
    const data = await res.json();
    
    loadingEl.style.display = 'none';
    renderList(data);
  } catch (err) {
    loadingEl.innerText = `Error: ${err.message}`;
  }
}

// Render daftar pasien
function renderList(patients) {
  listEl.innerHTML = '';
  
  if (patients.length === 0) {
    listEl.innerHTML = '<div class="empty">Tidak ada data skrining yang siap diinput.</div>';
    return;
  }
  
  patients.forEach(p => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="name">${p.nama_peserta}</div>
      <div class="nik">NIK: ${p.nik}</div>
      <div class="btn-group">
        <button class="btn-fill" data-id="${p.id}">✍️ Isi Form</button>
        <button class="btn-done" data-id="${p.id}">✅ Selesai</button>
      </div>
    `;
    
    // Tombol Isi Form
    card.querySelector('.btn-fill').addEventListener('click', () => fillForm(p));
    
    // Tombol Selesai
    card.querySelector('.btn-done').addEventListener('click', () => markDone(p.id));
    
    listEl.appendChild(card);
  });
}

// Fungsi utama yang diinjeksi dan dieksekusi langsung di semua frame SITB
async function runAutoFillOnPage(data) {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  
  const formatDate = (d) => {
    if (!d) return '';
    const parts = d.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
  };

  // Terjemahkan nilai agar persis dengan opsi dropdown SITB Kemenkes
  const normalizeGejala = (val) => {
    if (!val) return 'Tidak';
    const lower = String(val).toLowerCase();
    if (lower.includes('tidak') || lower === 'no') return 'Tidak';
    if (lower.includes('ada') || lower.includes('ya') || lower === 'yes') return 'Ya';
    return val;
  };

  const normalizeHasilSkrining = (val) => {
    if (!val) return 'Tidak Ada Gejala dan Tanda TBC';
    const lower = String(val).toLowerCase();
    if (lower.includes('bukan') || lower.includes('tidak')) return 'Tidak Ada Gejala dan Tanda TBC';
    return 'Terduga TBC';
  };

  const fields = [
    // Identitas
    { keywords: ['tanggal pelaksanaan', 'tanggal skrining'], val: formatDate(data.tanggal_skrining), isDropdown: false },
    { keywords: ['nama kegiatan'], val: data.nama_kegiatan || 'Skrining Oleh Fasyankes', isDropdown: true },
    { keywords: ['tempat skrining'], val: data.tempat_skrining || 'Puskesmas', isDropdown: true },
    { keywords: ['kewarganegaraan'], val: data.kewarganegaraan || 'WNI', isDropdown: true },
    { keywords: ['nik'], val: data.nik, isDropdown: false },
    { keywords: ['nama peserta'], val: data.nama_peserta, isDropdown: false },
    { keywords: ['jenis kelamin'], val: data.jenis_kelamin, isDropdown: true },
    { keywords: ['tanggal lahir'], val: formatDate(data.tanggal_lahir), isDropdown: false },
    { keywords: ['pekerjaan'], val: data.pekerjaan || 'Tidak Bekerja', isDropdown: true },

    // Alamat
    { keywords: ['provinsi ktp'], val: data.provinsi_ktp, isDropdown: true, delay: 0 },
    { keywords: ['kabupaten/kota ktp', 'kabupaten ktp'], val: data.kabupaten_ktp, isDropdown: true, delay: 1500 },
    { keywords: ['kecamatan ktp'], val: data.kecamatan_ktp, isDropdown: true, delay: 3000 },
    { keywords: ['kelurahan ktp'], val: data.kelurahan_ktp, isDropdown: true, delay: 4500 },
    { keywords: ['alamat ktp'], val: data.alamat_ktp, isDropdown: false },
    { keywords: ['sama dengan alamat'], val: data.sama_dengan_ktp || 'Ya', isDropdown: true },
    { keywords: ['no. hp', 'no hp', 'telepon'], val: data.no_hp, isDropdown: false },

    // Fisik
    { keywords: ['berat badan'], val: String(data.berat_badan || ''), isDropdown: false },
    { keywords: ['tinggi badan', 'panjang badan'], val: String(data.tinggi_badan || ''), isDropdown: false },

    // Riwayat & Risiko
    { keywords: ['riwayat kontak'], val: normalizeGejala(data.riwayat_kontak_tbc), isDropdown: true },
    { keywords: ['pernah terdiagnosa', 'berobat tbc'], val: normalizeGejala(data.pernah_tbc), isDropdown: true },
    { keywords: ['kekurangan gizi'], val: normalizeGejala(data.kekurangan_gizi), isDropdown: true },
    { keywords: ['merokok'], val: normalizeGejala(data.merokok), isDropdown: true },
    { keywords: ['riwayat dm', 'kencing manis'], val: normalizeGejala(data.riwayat_dm), isDropdown: true },
    { keywords: ['orang dengan hiv'], val: normalizeGejala(data.odha), isDropdown: true },
    { keywords: ['ibu hamil'], val: 'Tidak', isDropdown: true },

    // Gejala
    { keywords: ['batuk'], val: normalizeGejala(data.batuk), isDropdown: true },
    { keywords: ['bb turun', 'nafsu makan'], val: normalizeGejala(data.bb_turun), isDropdown: true },
    { keywords: ['demam hilang'], val: normalizeGejala(data.demam), isDropdown: true },
    { keywords: ['berkeringat malam'], val: normalizeGejala(data.berkeringat), isDropdown: true },
    { keywords: ['pembesaran kelenjar'], val: normalizeGejala(data.pembesaran_kelenjar), isDropdown: true },

    // Hasil Skrining & CXR
    { keywords: ['hasil skrining gejala'], val: normalizeHasilSkrining(data.hasil_skrining), isDropdown: true },
    { keywords: ['dilakukan pemeriksaan cxr'], val: normalizeGejala(data.dilakukan_cxr), isDropdown: true },
    { keywords: ['alasan tidak cxr'], val: 'Tidak', isDropdown: false },
    { keywords: ['terduga tbc'], val: normalizeGejala(data.terduga_tbc), isDropdown: true }
  ];

  let filledCount = 0;

  // Fungsi helper untuk mengisi sel input
  async function fillCell(cell, val, isDropdown) {
    if (!val && val !== 0) return false;
    const targetLower = String(val).trim().toLowerCase();

    if (isDropdown) {
      // 1. Cek jika select bawaan HTML
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

      // 2. Klik panah dropdown EasyUI/ExtJS
      const arrow = cell.querySelector('.combo-arrow, .textbox-icon, .x-form-trigger, a[class*="arrow"], a[class*="icon"], span[class*="arrow"]');
      if (arrow) {
        arrow.click();
        await sleep(150);

        const items = Array.from(document.querySelectorAll('.combobox-item, .x-combo-list-item, .x-boundlist-item, .combo-panel div'));
        const visibleItems = items.filter(it => {
          const r = it.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && it.textContent.trim().length > 0;
        });

        let found = visibleItems.find(it => it.textContent.trim().toLowerCase() === targetLower);
        if (!found) {
          found = visibleItems.find(it => {
            const t = it.textContent.trim().toLowerCase();
            return t.includes(targetLower) || targetLower.includes(t);
          });
        }

        if (found) {
          found.click();
          await sleep(80);
          return true;
        } else {
          arrow.click(); // Tutup kembali jika tidak ketemu
          await sleep(50);
        }
      }

      // 3. Fallback ketik teks langsung pada input combobox
      const inp = cell.querySelector('input:not([type="hidden"]), textarea');
      if (inp) {
        inp.focus();
        inp.value = val;
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        inp.blur();
      }
      const hid = cell.querySelector('input[type="hidden"]');
      if (hid) {
        hid.value = val;
        hid.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    } else {
      // Input teks biasa
      const inp = cell.querySelector('input:not([type="hidden"]), textarea');
      if (inp) {
        inp.focus();
        inp.value = String(val);
        inp.dispatchEvent(new Event('input', { bubbles: true }));
        inp.dispatchEvent(new Event('change', { bubbles: true }));
        inp.blur();
      }
      const hid = cell.querySelector('input[type="hidden"]');
      if (hid) {
        hid.value = String(val);
        hid.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return true;
    }
  }

  // Cari dan proses baris demi baris tabel form SITB
  const rows = Array.from(document.querySelectorAll('tr'));
  
  for (const field of fields) {
    if (field.delay && field.delay > 0) {
      // Tangani kolom bertingkat (Alamat) secara asinkron
      setTimeout(async () => {
        for (const tr of rows) {
          if (!tr.cells || tr.cells.length < 2) continue;
          let labelText = '';
          for (let i = 0; i < tr.cells.length - 1; i++) {
            labelText += ' ' + tr.cells[i].textContent.toLowerCase();
          }
          if (field.keywords.some(kw => labelText.includes(kw))) {
            const inputCell = tr.cells[tr.cells.length - 1];
            await fillCell(inputCell, field.val, field.isDropdown);
            break;
          }
        }
      }, field.delay);
      continue;
    }

    // Proses kolom standar langsung
    for (const tr of rows) {
      if (!tr.cells || tr.cells.length < 2) continue;
      let labelText = '';
      for (let i = 0; i < tr.cells.length - 1; i++) {
        labelText += ' ' + tr.cells[i].textContent.toLowerCase();
      }
      if (field.keywords.some(kw => labelText.includes(kw))) {
        const inputCell = tr.cells[tr.cells.length - 1];
        const ok = await fillCell(inputCell, field.val, field.isDropdown);
        if (ok) filledCount++;
        break;
      }
    }
  }

  if (filledCount >= 3) {
    alert('✅ SITB Assistant: Data berhasil disalin ke formulir SITB!\n\nMohon tunggu 3-4 detik hingga kolom Kabupaten/Kecamatan selesai termuat, lalu periksa kembali isiannya sebelum menekan tombol Simpan.');
  }
}

// Eksekusi script pengisian ke halaman web aktif (SITB)
async function fillForm(patientData) {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Eksekusi fungsi langsung di semua frame tanpa mengandalkan sendMessage
  await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    func: runAutoFillOnPage,
    args: [patientData]
  });
}

// Update status di Supabase menjadi "submitted"
async function markDone(id) {
  if (!confirm('Tandai data ini sebagai selesai diinput ke SITB?')) return;
  
  const btn = document.querySelector(`.btn-done[data-id="${id}"]`);
  btn.innerText = '⏳...';
  
  try {
    await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/screenings?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': CONFIG.SUPABASE_KEY,
        'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ 
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
    });
    
    fetchData(); // Refresh list
  } catch (err) {
    alert('Gagal update status: ' + err.message);
    btn.innerText = '✅ Selesai';
  }
}

// Init
fetchData();
