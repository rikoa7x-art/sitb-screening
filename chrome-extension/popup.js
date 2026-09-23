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

// Eksekusi script pengisian ke halaman web aktif (SITB)
async function fillForm(patientData) {
  try {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      alert('Tidak menemukan tab aktif. Pastikan Anda membuka halaman SITB.');
      return;
    }
    
    // Step 1: Expose data ke MAIN world via global variable
    // (content.js di ISOLATED_WORLD tidak bisa akses window.$, jQuery, atau Kendo API)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      func: (data) => { window.__sitbPatient__ = data; },
      args: [patientData],
      world: 'MAIN'
    });

    // Step 2: Jalankan content.js di MAIN world agar bisa pakai jQuery/Kendo API
    await chrome.scripting.executeScript({
      target: { tabId: tab.id, allFrames: true },
      files: ['content.js'],
      world: 'MAIN'
    });

  } catch (err) {
    alert('Gagal menyalin data: ' + err.message);
  }
}

// Update status ke "submitted" via backend proxy (bukan langsung ke Supabase)
// Ini mencegah Service Role Key bocor ke browser
async function markDone(id) {
  if (!confirm('Tandai data ini sebagai selesai diinput ke SITB?')) return;
  
  const btn = document.querySelector(`.btn-done[data-id="${id}"]`);
  btn.innerText = '⏳...';
  
  try {
    const res = await fetch(`${CONFIG.APP_URL}/api/extension/mark-submitted`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-Key': CONFIG.EXTENSION_SECRET_KEY,
      },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error || 'Gagal update status');
    }
    
    fetchData(); // Refresh list
  } catch (err) {
    alert('Gagal update status: ' + err.message);
    btn.innerText = '✅ Selesai';
  }
}

// Init
fetchData();

// Tombol Diagnostik - inject diagnostic.js ke semua frame di MAIN world
document.getElementById('btn-diagnostic').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    alert('Tidak ada tab aktif!');
    return;
  }
  await chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    files: ['diagnostic.js'],
    world: 'MAIN'
  });
  window.close(); // Tutup popup agar panel diagnostik terlihat
});
