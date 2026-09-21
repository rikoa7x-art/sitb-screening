'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Screening } from '@/lib/supabase'

interface DetailRow {
  label: string
  value: string | number | undefined | null
}

function DataRow({ label, value }: DetailRow) {
  return (
    <div className="flex border-b border-gray-50 py-2.5">
      <span className="w-52 text-sm text-gray-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value ?? '—'}</span>
    </div>
  )
}

export default function ScreeningDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('')
  const [data, setData] = useState<Screening | null>(null)
  const [loading, setLoading] = useState(true)
  const [catatan, setCatatan] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    params.then(({ id: resolvedId }) => {
      setId(resolvedId)
      fetch(`/api/screening/${resolvedId}`)
        .then(r => r.json())
        .then(d => { setData(d); setCatatan(d.catatan_petugas || '') })
        .finally(() => setLoading(false))
    })
  }, [params])

  const handleAction = async (action: 'approve' | 'reject') => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/screening/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, catatan_petugas: catatan, approved_by: 'Petugas Puskesmas' }),
      })
      const json = await res.json()
      if (res.ok) {
        setMessage(action === 'approve' ? '✅ Data disetujui' : '❌ Data ditolak')
        setData(prev => prev ? { ...prev, status: action === 'approve' ? 'approved' : 'rejected' } : prev)
      } else {
        setMessage(`Error: ${json.error}`)
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">⏳ Memuat data...</div>
  if (!data) return <div className="p-8 text-center text-red-500">Data tidak ditemukan</div>

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 text-sm">
            ← Kembali
          </button>
          <h1 className="text-xl font-bold text-gray-900">Detail Skrining</h1>
          <span className={`px-3 py-1 rounded-full text-xs font-medium
            ${data.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              data.status === 'approved' ? 'bg-green-100 text-green-700' :
              data.status === 'rejected' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'}`}>
            {data.status === 'pending' ? '⏳ Menunggu Review' :
             data.status === 'approved' ? '✅ Disetujui' :
             data.status === 'rejected' ? '❌ Ditolak' : '🚀 Terkirim ke SITB'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Data Detail */}
          <div className="lg:col-span-2 space-y-4">
            {/* Identitas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-blue-800 mb-3 pb-2 border-b border-gray-100">👤 Identitas Peserta</h2>
              <DataRow label="NIK" value={data.nik} />
              <DataRow label="Nama Peserta" value={data.nama_peserta} />
              <DataRow label="Jenis Kelamin" value={data.jenis_kelamin} />
              <DataRow label="Tanggal Lahir" value={data.tanggal_lahir} />
              <DataRow label="Umur" value={`${data.umur} tahun`} />
              <DataRow label="Pekerjaan" value={data.pekerjaan} />
              <DataRow label="No. HP" value={data.no_hp} />
              <DataRow label="Tanggal Skrining" value={data.tanggal_skrining} />
              <DataRow label="Tempat Skrining" value={data.tempat_skrining} />
            </div>

            {/* Alamat */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-blue-800 mb-3 pb-2 border-b border-gray-100">🏠 Alamat</h2>
              <DataRow label="Provinsi KTP" value={data.provinsi_ktp} />
              <DataRow label="Kabupaten/Kota" value={data.kabupaten_ktp} />
              <DataRow label="Kecamatan" value={data.kecamatan_ktp} />
              <DataRow label="Kelurahan" value={data.kelurahan_ktp} />
              <DataRow label="Alamat KTP" value={data.alamat_ktp} />
              <DataRow label="Sama dengan KTP" value={data.sama_dengan_ktp} />
            </div>

            {/* Pemeriksaan */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-blue-800 mb-3 pb-2 border-b border-gray-100">⚖️ Pemeriksaan Fisik</h2>
              <DataRow label="Berat Badan" value={`${data.berat_badan} kg`} />
              <DataRow label="Tinggi Badan" value={`${data.tinggi_badan} cm`} />
              <DataRow label="IMT" value={`${data.imt} kg/m²`} />
              <DataRow label="Status Gizi" value={data.hasil_status_gizi} />
              <DataRow label="Riwayat Kontak TBC" value={data.riwayat_kontak_tbc} />
            </div>

            {/* Faktor Risiko */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-orange-700 mb-3 pb-2 border-b border-gray-100">⚠️ Faktor Risiko</h2>
              <DataRow label="Pernah TBC" value={data.pernah_tbc} />
              <DataRow label="Kekurangan Gizi" value={data.kekurangan_gizi} />
              <DataRow label="Merokok" value={data.merokok} />
              <DataRow label="Riwayat DM" value={data.riwayat_dm} />
              <DataRow label="ODHA" value={data.odha} />
            </div>

            {/* Gejala */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-red-700 mb-3 pb-2 border-b border-gray-100">🩺 Gejala dan Tanda</h2>
              <DataRow label="Batuk" value={data.batuk} />
              <DataRow label="BB Turun / Nafsu Makan" value={data.bb_turun} />
              <DataRow label="Demam Hilang Timbul" value={data.demam} />
              <DataRow label="Berkeringat Malam" value={data.berkeringat} />
              <DataRow label="Pembesaran Kelenjar" value={data.pembesaran_kelenjar} />
              <DataRow label="Hasil Skrining" value={data.hasil_skrining} />
              <DataRow label="Dilakukan CXR" value={data.dilakukan_cxr} />
              <DataRow label="Terduga TBC" value={data.terduga_tbc} />
            </div>
          </div>

          {/* Action Panel */}
          <div className="space-y-4">
            {/* Review Card */}
            {data.status === 'pending' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-6">
                <h2 className="font-bold text-gray-800 mb-3">📋 Review Data</h2>
                <textarea
                  rows={4}
                  placeholder="Catatan petugas (opsional)..."
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                />
                {message && (
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-700 text-sm mb-3">{message}</div>
                )}
                <div className="space-y-2">
                  <button
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading}
                    className="w-full bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                  >
                    ✅ Setujui Data
                  </button>
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={actionLoading}
                    className="w-full border-2 border-red-500 text-red-600 py-2.5 rounded-lg font-medium hover:bg-red-50 transition disabled:opacity-50"
                  >
                    ❌ Tolak Data
                  </button>
                </div>
              </div>
            )}

            {/* Auto-fill Info Card */}
            {data.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <h2 className="font-bold text-green-800 mb-2">🚀 Siap Auto-fill SITB</h2>
                <p className="text-sm text-green-700 mb-4">
                  Data telah disetujui. Jalankan perintah berikut di komputer petugas:
                </p>
                <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono text-green-400 break-all">
                  <p className="text-gray-400 mb-1"># Di folder sitb-screening:</p>
                  npx ts-node playwright/sitb-autofill.ts --id {id}
                </div>
                <p className="text-xs text-green-600 mt-2">
                  Script akan membuka browser, login SITB, dan mengisi form otomatis.
                </p>
              </div>
            )}

            {/* Info Submission */}
            {data.submitted_at && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800">🏆 Terkirim ke SITB</p>
                <p className="text-xs text-blue-600 mt-1">
                  {new Date(data.submitted_at).toLocaleString('id-ID')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
