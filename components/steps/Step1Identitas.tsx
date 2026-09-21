'use client'

import { useFormContext } from 'react-hook-form'
import type { ScreeningFormData } from '@/lib/validations'
import { OPSI_PEKERJAAN, OPSI_TEMPAT } from '@/lib/validations'
import FormField from '../FormField'

export default function Step1Identitas() {
  const { register, formState: { errors }, watch } = useFormContext<ScreeningFormData>()
  
  const tglLahir = watch('tanggal_lahir')
  const umur = tglLahir
    ? Math.floor((Date.now() - new Date(tglLahir).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  return (
    <div>
      <h2 className="text-lg font-bold text-blue-800 mb-1">Identitas Diri Peserta</h2>
      <p className="text-sm text-gray-500 mb-5">Isi data diri Anda dengan lengkap dan benar sesuai KTP.</p>

      <div className="space-y-4">
        <FormField label="Tanggal Skrining" required error={errors.tanggal_skrining?.message}>
          <input type="date" {...register('tanggal_skrining')}
            className="form-input" />
        </FormField>

        <FormField label="Tempat Skrining" required error={errors.tempat_skrining?.message}>
          <select {...register('tempat_skrining')} className="form-select">
            <option value="">-- Pilih Tempat --</option>
            {OPSI_TEMPAT.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </FormField>

        <div className="bg-blue-50 rounded-lg px-4 py-2 text-sm text-blue-700">
          <span className="font-medium">Unit Pelaksana:</span> Puskesmas Tanjungwangi
        </div>

        <FormField label="NIK" required error={errors.nik?.message}>
          <input type="text" maxLength={16} placeholder="16 digit NIK sesuai KTP"
            {...register('nik')} className="form-input" />
        </FormField>

        <FormField label="Nama Lengkap" required error={errors.nama_peserta?.message}>
          <input type="text" placeholder="Nama sesuai KTP"
            {...register('nama_peserta')} className="form-input" />
        </FormField>

        <FormField label="Jenis Kelamin" required error={errors.jenis_kelamin?.message}>
          <select {...register('jenis_kelamin')} className="form-select">
            <option value="">-- Pilih --</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </FormField>

        <FormField label="Tanggal Lahir" required error={errors.tanggal_lahir?.message}>
          <input type="date" {...register('tanggal_lahir')} className="form-input" />
        </FormField>

        {umur !== null && umur >= 0 && (
          <div className="bg-green-50 rounded-lg px-4 py-2 text-sm text-green-700">
            <span className="font-medium">Umur:</span> {umur} tahun
          </div>
        )}

        <FormField label="Pekerjaan" required error={errors.pekerjaan?.message}>
          <select {...register('pekerjaan')} className="form-select">
            <option value="">-- Pilih Pekerjaan --</option>
            {OPSI_PEKERJAAN.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </FormField>

        <FormField label="No. HP / WhatsApp" error={errors.no_hp?.message}>
          <input type="tel" placeholder="08xxxxxxxxxx"
            {...register('no_hp')} className="form-input" />
        </FormField>
      </div>
    </div>
  )
}
