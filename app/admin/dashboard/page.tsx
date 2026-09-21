'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
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
                        <Link
                          href={`/admin/dashboard/${row.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium text-xs underline"
                        >
                          Detail →
                        </Link>
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
    </div>
  )
}
