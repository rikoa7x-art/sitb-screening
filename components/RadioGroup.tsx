'use client'

import { useFormContext } from 'react-hook-form'
import type { ScreeningFormData } from '@/lib/validations'

interface RadioGroupProps {
  name: keyof ScreeningFormData
  options: string[]
}

export default function RadioGroup({ name, options }: RadioGroupProps) {
  const { register, watch } = useFormContext<ScreeningFormData>()
  const value = watch(name)

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <label
          key={opt}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer text-sm transition-all
            ${value === opt
              ? 'bg-blue-600 border-blue-600 text-white font-medium'
              : 'border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 bg-white'
            }`}
        >
          <input
            type="radio"
            value={opt}
            {...register(name)}
            className="sr-only"
          />
          {opt}
        </label>
      ))}
    </div>
  )
}
