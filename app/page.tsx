import ScreeningForm from '@/components/ScreeningForm'

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          🦠 Program Eliminasi TBC Nasional
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Form Skrining Tuberkulosis (TBC)
        </h1>
        <p className="text-gray-600 max-w-lg mx-auto text-sm md:text-base">
          Silakan isi formulir berikut dengan lengkap dan jujur. 
          Data Anda akan ditinjau oleh petugas sebelum diproses.
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: '🔒', title: 'Data Aman', desc: 'Data Anda dienkripsi dan dijaga kerahasiaannya' },
          { icon: '⚡', title: 'Proses Cepat', desc: 'Petugas akan meninjau dalam 1x24 jam' },
          { icon: '📋', title: 'Terintegrasi', desc: 'Langsung tersambung ke sistem SITB nasional' },
        ].map((card) => (
          <div key={card.title} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl mb-2">{card.icon}</div>
            <h3 className="font-semibold text-gray-800 text-sm">{card.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <ScreeningForm />
    </div>
  )
}
