'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step { label: string }

interface StepIndicatorProps {
  currentStep: number
  steps: Step[]
}

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="w-full py-4 mb-6">
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-10" />
        {/* Progress line */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-green-600 transition-all duration-500 -z-10"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const num = index + 1
          const isCompleted = num < currentStep
          const isActive = num === currentStep
          const isPending = num > currentStep

          return (
            <div key={step.label} className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white',
                  isCompleted && 'bg-green-600 border-green-600 text-white',
                  isActive && 'bg-green-600 border-green-600 text-white scale-110 shadow-sm shadow-green-100',
                  isPending && 'border-slate-200 text-slate-400',
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 stroke-[3]" />
                ) : (
                  <span className="text-sm font-bold">{num}</span>
                )}
              </div>
              <span
                className={cn(
                  'mt-3 text-xs font-semibold transition-colors whitespace-nowrap hidden md:block',
                  isActive ? 'text-slate-900' : 'text-slate-400',
                )}
              >
                {step.label}
              </span>
              {isActive && (
                <span className="mt-3 text-[10px] font-bold text-slate-900 md:hidden">{step.label}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
