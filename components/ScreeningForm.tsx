'use client'

import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { screeningSchema, type ScreeningFormData } from '@/lib/validations'
import Step1Identitas from './steps/Step1Identitas'
import Step2Alamat from './steps/Step2Alamat'
import Step3Pemeriksaan from './steps/Step3Pemeriksaan'
import Step4Gejala from './steps/Step4Gejala'

const STEPS = [
  { label: 'Identitas', icon: '👤' },
  { label: 'Alamat', icon: '🏠' },
  { label: 'Pemeriksaan', icon: '⚖️' },
  { label: 'Gejala', icon: '🩺' },
]

export default function ScreeningForm() {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const methods = useForm<ScreeningFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(screeningSchema) as any,
    defaultValues: {
      nama_kegiatan: 'Skrining Oleh Fasyankes',
      kewarganegaraan: 'WNI',
      sama_dengan_ktp: 'Ya',
      tanggal_skrining: new Date().toISOString().split('T')[0],
      provinsi_ktp: 'Jawa Barat',
      kabupaten_ktp: 'Kabupaten Subang',
      kecamatan_ktp: 'Cijambe',
      hasil_skrining: 'Bukan Suspek TBC',
      dilakukan_cxr: 'Tidak',
      terduga_tbc: 'Tidak',
      keterangan: 'Tracing TB 2026',
    },
    mode: 'onChange',
  })

  const { handleSubmit, trigger, formState: { errors } } = methods

  const stepFields: (keyof ScreeningFormData)[][] = [
    // Step 1
    ['tanggal_skrining', 'tempat_skrining', 'nik', 'nama_peserta', 'jenis_kelamin', 'tanggal_lahir', 'pekerjaan'],
    // Step 2
    ['provinsi_ktp', 'kabupaten_ktp', 'kecamatan_ktp', 'kelurahan_ktp', 'alamat_ktp'],
    // Step 3
    ['berat_badan', 'tinggi_badan', 'riwayat_kontak_tbc', 'pernah_tbc', 'kekurangan_gizi', 'merokok', 'riwayat_dm', 'odha'],
    // Step 4
    ['batuk', 'bb_turun', 'demam', 'berkeringat', 'pembesaran_kelenjar'],
  ]

  const nextStep = async () => {
    const valid = await trigger(stepFields[step])
    if (valid) setStep(s => s + 1)
  }

  const prevStep = () => setStep(s => s - 1)

  const onSubmit = async (data: ScreeningFormData) => {
    setLoading(true)
    setError('')
    try {
      const hasSymptoms = ['batuk', 'bb_turun', 'demam', 'berkeringat', 'pembesaran_kelenjar'].some(
        f => (data as any)[f] === 'Ada'
      )
      const payload: ScreeningFormData = {
        ...data,
        hasil_skrining: data.hasil_skrining || (hasSymptoms ? 'Suspek TBC' : 'Bukan Suspek TBC'),
        dilakukan_cxr: data.dilakukan_cxr || 'Tidak',
        terduga_tbc: data.terduga_tbc || (hasSymptoms ? 'Ya' : 'Tidak'),
        keterangan: data.keterangan || 'Tracing TB 2026',
      }

      const res = await fetch('/api/screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Gagal menyimpan data')
      }
      const { id } = await res.json()
      router.push(`/success?id=${id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormProvider {...methods}>
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center mb-5 sm:mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className={`flex flex-col items-center ${i <= step ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-base sm:text-lg font-bold border-2 transition-all
                  ${i < step ? 'bg-blue-600 border-blue-600 text-white' :
                    i === step ? 'border-blue-600 bg-white text-blue-600' :
                    'border-gray-300 bg-white text-gray-400'}`}>
                  {i < step ? '✓' : s.icon}
                </div>
                {/* Label: selalu tampil di sm ke atas, di mobile hanya tampil untuk step aktif */}
                <span className={`text-xs mt-1 font-medium leading-tight text-center
                  ${i === step ? 'block' : 'hidden sm:block'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded transition-all ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit as any)}>
            {step === 0 && <Step1Identitas />}
            {step === 1 && <Step2Alamat />}
            {step === 2 && <Step3Pemeriksaan />}
            {step === 3 && <Step4Gejala />}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 sm:flex-none px-5 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition text-sm sm:text-base active:bg-gray-100"
                >
                  ← Kembali
                </button>
              ) : <div className="flex-1 sm:flex-none" />}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 sm:flex-none px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition text-sm sm:text-base active:bg-blue-800"
                >
                  Selanjutnya →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-none px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed active:bg-green-800"
                >
                  {loading ? '⏳ Menyimpan...' : '✅ Kirim Data Skrining'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </FormProvider>
  )
}
