import ScreeningForm from '@/components/ScreeningForm'

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-4 sm:mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-3">
          🦠 Program Eliminasi TBC Nasional
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
          Form Skrining Tuberkulosis (TBC)
        </h1>
        <p className="text-gray-600 max-w-lg mx-auto text-xs sm:text-sm md:text-base">
          Silakan isi formulir berikut dengan lengkap dan jujur.
          Data Anda akan ditinjau oleh petugas sebelum diproses.
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
        {[
          { icon: '🔒', title: 'Data Aman', desc: 'Dienkripsi & dijaga' },
          { icon: '⚡', title: 'Proses Cepat', desc: 'Tinjau dalam 1×24 jam' },
          { icon: '📋', title: 'Terintegrasi', desc: 'Tersambung ke SITB' },
        ].map((card) => (
          <div key={card.title} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{card.icon}</div>
            <h3 className="font-semibold text-gray-800 text-xs sm:text-sm">{card.title}</h3>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <ScreeningForm />
    </div>
  )
}
