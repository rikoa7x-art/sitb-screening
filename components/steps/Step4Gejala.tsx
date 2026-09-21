'use client'

import { useFormContext } from 'react-hook-form'
import type { ScreeningFormData } from '@/lib/validations'
import FormField from '../FormField'
import RadioGroup from '../RadioGroup'

const GEJALA_LIST = [
  { name: 'batuk' as const, label: 'Batuk', desc: 'Batuk lebih dari 2 minggu' },
  { name: 'bb_turun' as const, label: 'BB Turun / Nafsu Makan Turun', desc: 'Tanpa penyebab yang jelas' },
  { name: 'demam' as const, label: 'Demam Hilang Timbul', desc: 'Tanpa sebab yang jelas' },
  { name: 'berkeringat' as const, label: 'Berkeringat Malam Hari', desc: 'Tanpa kegiatan fisik' },
  { name: 'pembesaran_kelenjar' as const, label: 'Pembesaran Kelenjar Getah Bening', desc: 'Di leher atau bagian tubuh lain' },
]

export default function Step4Gejala() {
  const { register, formState: { errors } } = useFormContext<ScreeningFormData>()

  return (
    <div>
      <h2 className="text-lg font-bold text-blue-800 mb-1">Skrining Gejala</h2>
      <p className="text-sm text-gray-500 mb-5">Jawab pertanyaan gejala dengan jujur berdasarkan kondisi Anda.</p>

      <div className="space-y-4">
        {/* Gejala */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-red-800">🩺 Gejala dan Tanda TBC</p>
        </div>

        <div className="space-y-4">
          {GEJALA_LIST.map(({ name, label, desc }) => (
            <div key={name} className="border border-gray-200 rounded-lg p-3">
              <p className="font-medium text-gray-800 text-sm">{label}</p>
              <p className="text-xs text-gray-500 mb-2">{desc}</p>
              {errors[name] && <p className="text-xs text-red-500 mb-1">{errors[name]?.message}</p>}
              <RadioGroup name={name} options={['Tidak Ada', 'Ada', 'Tidak Diketahui']} />
            </div>
          ))}
        </div>

        {/* Keterangan */}
        <div className="border-t border-gray-200 pt-4">
          <FormField label="Keterangan" error={errors.keterangan?.message}>
            <input
              type="text"
              {...register('keterangan')}
              className="form-input"
              placeholder="Tracing TB 2026"
            />
          </FormField>
        </div>

        {/* Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-yellow-800">
            <strong>⚠️ Perhatian:</strong> Data yang Anda isi akan ditinjau oleh petugas Puskesmas Tanjungwangi sebelum dimasukkan ke sistem SITB. Pastikan semua data yang diisi adalah benar dan akurat.
          </p>
        </div>
      </div>
    </div>
  )
}
