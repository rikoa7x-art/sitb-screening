import Link from 'next/link'

export default function SuccessPage({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams.id || ''
  const shortId = id.slice(0, 8).toUpperCase()

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-md w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Berhasil Dikirim!</h1>
        <p className="text-gray-600 mb-6">
          Terima kasih telah mengisi form skrining TBC. Data Anda akan ditinjau oleh petugas Puskesmas Tanjungwangi.
        </p>

        {shortId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700 mb-1">Nomor Referensi Anda</p>
            <p className="text-2xl font-mono font-bold text-blue-800">{shortId}</p>
            <p className="text-xs text-blue-600 mt-1">Simpan nomor ini untuk konfirmasi</p>
          </div>
        )}

        <div className="space-y-2 text-sm text-gray-500 mb-8">
          <p>📞 Pertanyaan? Hubungi: <strong>(022) xxx-xxxx</strong></p>
          <p>🕐 Peninjauan dalam 1×24 jam kerja</p>
        </div>

        <Link
          href="/"
          className="block w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Kembali ke Halaman Utama
        </Link>
      </div>
    </div>
  )
}
