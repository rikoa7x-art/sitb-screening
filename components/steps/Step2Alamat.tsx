'use client'

import { useFormContext } from 'react-hook-form'
import type { ScreeningFormData } from '@/lib/validations'
import { PROVINSI_LIST, OPSI_DESA } from '@/lib/validations'
import FormField from '../FormField'

export default function Step2Alamat() {
  const { register, formState: { errors }, watch } = useFormContext<ScreeningFormData>()
  const samaKtp = watch('sama_dengan_ktp')

  return (
    <div>
      <h2 className="text-lg font-bold text-blue-800 mb-1">Alamat</h2>
      <p className="text-sm text-gray-500 mb-5">Isi alamat sesuai Kartu Tanda Penduduk (KTP).</p>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
          <p className="text-sm font-semibold text-blue-800">📌 Alamat Sesuai KTP</p>
        </div>

        <FormField label="Provinsi" required error={errors.provinsi_ktp?.message}>
          <div className="relative">
            <input
              type="text"
              readOnly
              {...register('provinsi_ktp')}
              className="form-input bg-gray-100 text-gray-700 font-medium cursor-not-allowed pr-24"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
              🔒 Terkunci
            </span>
          </div>
        </FormField>

        <FormField label="Kabupaten / Kota" required error={errors.kabupaten_ktp?.message}>
          <div className="relative">
            <input
              type="text"
              readOnly
              {...register('kabupaten_ktp')}
              className="form-input bg-gray-100 text-gray-700 font-medium cursor-not-allowed pr-24"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
              🔒 Terkunci
            </span>
          </div>
        </FormField>

        <FormField label="Kecamatan" required error={errors.kecamatan_ktp?.message}>
          <div className="relative">
            <input
              type="text"
              readOnly
              {...register('kecamatan_ktp')}
              className="form-input bg-gray-100 text-gray-700 font-medium cursor-not-allowed pr-24"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
              🔒 Terkunci
            </span>
          </div>
        </FormField>

        <FormField label="Kelurahan / Desa" required error={errors.kelurahan_ktp?.message}>
          <select {...register('kelurahan_ktp')} className="form-select">
            <option value="">-- Pilih Kelurahan / Desa --</option>
            {OPSI_DESA.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </FormField>

        <FormField label="Alamat Lengkap" required error={errors.alamat_ktp?.message}>
          <textarea rows={3} placeholder="Nama jalan, nomor rumah, RT/RW"
            {...register('alamat_ktp')} className="form-input resize-none" />
        </FormField>

        <div className="border-t border-gray-200 pt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
            <p className="text-sm font-semibold text-blue-800">🏡 Alamat Domisili</p>
          </div>
          <FormField label="Sama dengan Alamat KTP?" required error={errors.sama_dengan_ktp?.message}>
            <select {...register('sama_dengan_ktp')} className="form-select">
              <option value="Ya">Ya</option>
              <option value="Tidak">Tidak</option>
            </select>
          </FormField>
        </div>

        {samaKtp === 'Tidak' && (
          <div className="space-y-4 border-l-4 border-blue-300 pl-4">
            <FormField label="Provinsi Domisili" error={errors.provinsi_domisili?.message}>
              <select {...register('provinsi_domisili')} className="form-select">
                <option value="">-- Pilih Provinsi --</option>
                {PROVINSI_LIST.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>
            <FormField label="Kabupaten / Kota Domisili" error={errors.kabupaten_domisili?.message}>
              <input type="text" {...register('kabupaten_domisili')} className="form-input"
                placeholder="Kabupaten/kota domisili" />
            </FormField>
            <FormField label="Kecamatan Domisili" error={errors.kecamatan_domisili?.message}>
              <input type="text" {...register('kecamatan_domisili')} className="form-input" />
            </FormField>
            <FormField label="Kelurahan Domisili" error={errors.kelurahan_domisili?.message}>
              <input type="text" {...register('kelurahan_domisili')} className="form-input" />
            </FormField>
            <FormField label="Alamat Domisili Lengkap" error={errors.alamat_domisili?.message}>
              <textarea rows={3} {...register('alamat_domisili')}
                className="form-input resize-none" placeholder="Alamat domisili lengkap" />
            </FormField>
          </div>
        )}
      </div>
    </div>
  )
}
