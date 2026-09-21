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
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id, allFrames: true },
    files: ['content.js']
  }, () => {
    chrome.tabs.sendMessage(tab.id, { action: 'FILL_DATA', data: patientData });
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
