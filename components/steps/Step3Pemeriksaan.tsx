'use client'

import { useFormContext } from 'react-hook-form'
import type { ScreeningFormData } from '@/lib/validations'
import { OPSI_HASIL_GIZI, OPSI_KONTAK, OPSI_YA_TIDAK } from '@/lib/validations'
import FormField from '../FormField'
import RadioGroup from '../RadioGroup'

export default function Step3Pemeriksaan() {
  const { register, watch, formState: { errors } } = useFormContext<ScreeningFormData>()

  const bb = parseFloat(watch('berat_badan') as any) || 0
  const tb = parseFloat(watch('tinggi_badan') as any) || 0
  const imt = tb > 0 ? (bb / ((tb / 100) ** 2)).toFixed(1) : null
  
  const getStatusGizi = (imt: number) => {
    if (imt < 17.0) return { label: 'Sangat Kurang', color: 'text-red-600' }
    if (imt < 18.5) return { label: 'Kurang', color: 'text-orange-600' }
    if (imt < 25.0) return { label: 'Normal', color: 'text-green-600' }
    if (imt < 27.0) return { label: 'Lebih', color: 'text-yellow-600' }
    return { label: 'Obesitas', color: 'text-red-700' }
  }
  const statusGizi = imt ? getStatusGizi(parseFloat(imt)) : null

  const faktors = [
    { name: 'pernah_tbc' as const, label: 'Pernah terdiagnosa / berobat TBC' },
    { name: 'kekurangan_gizi' as const, label: 'Kekurangan Gizi' },
    { name: 'merokok' as const, label: 'Merokok' },
    { name: 'riwayat_dm' as const, label: 'Riwayat DM / Kencing Manis' },
    { name: 'odha' as const, label: 'Orang Dengan HIV (ODHA)' },
  ]

  return (
    <div>
      <h2 className="text-lg font-bold text-blue-800 mb-1">Pemeriksaan Fisik & Faktor Risiko</h2>
      <p className="text-sm text-gray-500 mb-5">Isi data pemeriksaan dan faktor risiko dengan jujur.</p>

      <div className="space-y-4">
        {/* BB & TB */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-blue-800">⚖️ Pengukuran Tubuh</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Berat Badan (kg)" required error={errors.berat_badan?.message}>
            <input type="number" min="1" max="300" step="0.1" placeholder="0"
              {...register('berat_badan')} className="form-input" />
          </FormField>
          <FormField label="Tinggi Badan (cm)" required error={errors.tinggi_badan?.message}>
            <input type="number" min="1" max="300" step="0.1" placeholder="0"
              {...register('tinggi_badan')} className="form-input" />
          </FormField>
        </div>

        {imt && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-500">Indeks Massa Tubuh (IMT)</p>
              <p className="text-2xl font-bold text-gray-800">{imt} <span className="text-sm font-normal">kg/m²</span></p>
            </div>
            {statusGizi && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Status Gizi</p>
                <p className={`font-bold text-lg ${statusGizi.color}`}>{statusGizi.label}</p>
              </div>
            )}
          </div>
        )}

        {/* Riwayat Kontak */}
        <div className="border-t border-gray-200 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <p className="text-sm font-semibold text-blue-800">🤝 Riwayat Kontak TBC</p>
          </div>
          <FormField label="Memiliki Riwayat Kontak dengan Pasien TBC?" required error={errors.riwayat_kontak_tbc?.message}>
            <select {...register('riwayat_kontak_tbc')} className="form-select">
              <option value="">-- Pilih --</option>
              {OPSI_KONTAK.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </FormField>
        </div>

        {/* Faktor Risiko */}
        <div className="border-t border-gray-200 pt-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
            <p className="text-sm font-semibold text-orange-800">⚠️ Faktor Risiko</p>
          </div>
          <div className="space-y-3">
            {faktors.map(({ name, label }) => (
              <FormField key={name} label={label} required error={errors[name]?.message}>
                <RadioGroup name={name} options={['Ya', 'Tidak', 'Tidak Diketahui']} />
              </FormField>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
