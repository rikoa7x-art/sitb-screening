'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Screening, ScreeningStatus } from '@/lib/supabase'

const STATUS_CONFIG: Record<ScreeningStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '⏳ Menunggu', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  approved: { label: '✅ Disetujui', color: 'text-green-700', bg: 'bg-green-100' },
  rejected: { label: '❌ Ditolak', color: 'text-red-700', bg: 'bg-red-100' },
  submitted: { label: '🚀 Terkirim ke SITB', color: 'text-blue-700', bg: 'bg-blue-100' },
}

export default function AdminDashboard() {
  const [data, setData] = useState<Screening[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Screening | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' })
    router.push('/admin')
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
      })
      const res = await fetch(`/api/screening?${params}`)
      const json = await res.json()
      setData(json.data || [])
      setTotal(json.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [statusFilter, page])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/screening/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (res.ok) {
        setNotification({ type: 'success', message: `Data skrining atas nama ${deleteTarget.nama_peserta} berhasil dihapus.` })
        setData(prev => prev.filter(item => item.id !== deleteTarget.id))
        setTotal(prev => Math.max(0, prev - 1))
        setDeleteTarget(null)
      } else {
        setNotification({ type: 'error', message: json.error || 'Gagal menghapus data' })
      }
    } catch {
      setNotification({ type: 'error', message: 'Terjadi kesalahan saat menghapus data' })
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = search
    ? data.filter(d =>
        d.nama_peserta.toLowerCase().includes(search.toLowerCase()) ||
        d.nik.includes(search)
      )
    : data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Panel Skrining TBC</h1>
            <p className="text-sm text-gray-500">Puskesmas Tanjungwangi</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
              {total} Total Data
            </span>
            <button
              onClick={fetchData}
              className="text-sm border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleLogout}
              className="text-sm border border-red-200 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Notification Toast */}
        {notification && (
          <div
            className={`mb-5 p-4 rounded-xl text-sm flex items-center justify-between shadow-sm border ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{notification.type === 'success' ? '✅' : '⚠️'}</span>
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold ml-4 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(['all', 'pending', 'approved', 'submitted'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`bg-white rounded-xl p-4 shadow-sm border-2 text-left transition-all
                ${statusFilter === s ? 'border-blue-500' : 'border-transparent hover:border-gray-200'}`}
            >
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {s === 'all' ? 'Semua' : STATUS_CONFIG[s as ScreeningStatus]?.label}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {s === statusFilter ? total : '—'}
              </p>
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="🔍 Cari nama atau NIK..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu</option>
              <option value="approved">Disetujui</option>
              <option value="rejected">Ditolak</option>
              <option value="submitted">Terkirim ke SITB</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Tanggal</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">NIK</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nama Peserta</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Hasil Skrining</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      ⏳ Memuat data...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      📭 Tidak ada data
                    </td>
                  </tr>
                ) : filtered.map(row => {
                  const cfg = STATUS_CONFIG[row.status]
                  return (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(row.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-700">{row.nik}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{row.nama_peserta}</td>
                      <td className="px-4 py-3 text-gray-600">{row.hasil_skrining}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Link
                            href={`/admin/dashboard/${row.id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs underline"
                          >
                            Detail →
                          </Link>
                          <span className="text-gray-300">|</span>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(row)}
                            className="text-red-600 hover:text-red-800 font-medium text-xs hover:underline flex items-center gap-1 transition"
                            title="Hapus data"
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Menampilkan {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} dari {total}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  ← Prev
                </button>
                <button
                  disabled={page * 20 >= total}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus Data</h3>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              Apakah Anda yakin ingin menghapus data skrining peserta berikut?
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 my-3 text-sm">
              <p className="font-semibold text-gray-900">{deleteTarget.nama_peserta}</p>
              <p className="text-gray-500 font-mono text-xs mt-1">NIK: {deleteTarget.nik}</p>
              <p className="text-gray-500 text-xs mt-1">
                Tgl Skrining: {new Date(deleteTarget.tanggal_skrining || deleteTarget.created_at).toLocaleDateString('id-ID')}
              </p>
            </div>
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg mb-6 border border-red-100">
              ⚠️ Peringatan: Tindakan ini bersifat permanen. Data yang telah dihapus tidak dapat dipulihkan kembali.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? '⏳ Menghapus...' : '🗑️ Ya, Hapus Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
