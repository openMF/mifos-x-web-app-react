/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { Button } from '@/components/ui/button'
import { useState, type ReactNode } from 'react'

interface Steps {
  icon: ReactNode
  label: string
  component: ReactNode
}

interface StepsProp {
  steps: Steps[]
}

const AppStepper = ({ steps }: StepsProp) => {
  const [currentStep, setCurrentStep] = useState(0)

  const nextPage = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevPage = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={index} className="flex-1 text-center relative">
            {/* Step Icon Circle */}
            <div
              className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full border-2 transition-all
        ${
          index === currentStep
            ? 'bg-blue-600 text-white border-blue-600'
            : 'border-zinc-400 text-zinc-600'
        }
      `}
            >
              {step.icon}
            </div>

            {/* Step Label (Hidden on small screens) */}
            <div
              className={`text-sm mt-2 font-medium hidden sm:block ${
                index === currentStep ? 'text-blue-600' : 'text-zinc-500'
              }`}
            >
              {step.label}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="absolute top-4 right-0 w-full h-0.5 bg-zinc-300 z-[-1]" />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 border rounded-md p-6 shadow-sm">
        {steps[currentStep].component}
      </div>

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          disabled={currentStep === 0}
          onClick={prevPage}
        >
          Previous
        </Button>

        <Button
          className="bg-[#1074b9] hover:bg-[#0d65a2] text-white"
          disabled={currentStep === steps.length - 1}
          onClick={nextPage}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export default AppStepper
