/**
 * Copyright since 2025 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, Pencil, Loader2, ArrowLeft, ArrowRight } from 'lucide-react'

export interface MultiStepFormStep {
  title: string
  component: ReactNode
  validate?: () => string | null
}

interface MultiStepFormProps {
  prefix: string
  steps: MultiStepFormStep[]
  onSubmit: () => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  submitLabel?: string
  className?: string
}

/** Animates open/close by measuring real content height */
function AnimatedStepContent({
  isOpen,
  children,
}: {
  isOpen: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>(0)

  useEffect(() => {
    if (!ref.current) return
    if (isOpen) {
      // Animate from measured height to 'auto' so content is never clipped
      const measured = ref.current.scrollHeight
      setHeight(measured)
      const t = setTimeout(() => setHeight('auto'), 300)
      return () => clearTimeout(t)
    } else {
      // Snap from 'auto' to measured px first, then animate to 0
      const measured = ref.current.scrollHeight
      setHeight(measured)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeight(0))
      })
    }
  }, [isOpen])

  return (
    <div
      style={{
        height,
        overflow: isOpen && height === 'auto' ? 'visible' : 'hidden',
        transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        ref={ref}
        style={{
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'translateY(0)' : 'translateY(-6px)',
          transition: 'opacity 250ms ease, transform 250ms ease',
          transitionDelay: isOpen ? '60ms' : '0ms',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function MultiStepForm({
  prefix,
  steps,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Submit',
  className,
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [stepError, setStepError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isLast = currentStep === steps.length - 1

  const validateCurrent = (): boolean => {
    const validate = steps[currentStep].validate
    if (validate) {
      const error = validate()
      if (error) {
        setStepError(error)
        return false
      }
    }
    setStepError(null)
    return true
  }

  const handleNext = () => {
    if (!validateCurrent()) return
    setCompletedSteps(prev => new Set(prev).add(currentStep))
    setCurrentStep(s => s + 1)
  }

  const handleBack = () => {
    setStepError(null)
    setCurrentStep(s => s - 1)
  }

  const handleStepClick = (index: number) => {
    if (index === currentStep) return

    if (index < currentStep) {
      setStepError(null)
      setCurrentStep(index)
      return
    }

    if (completedSteps.has(index)) {
      setStepError(null)
      setCurrentStep(index)
      return
    }

    if (index === currentStep + 1) {
      if (!validateCurrent()) return

      setCompletedSteps(prev => new Set(prev).add(currentStep))
      setStepError(null)
      setCurrentStep(index)
    }
  }

  const handleSubmit = async () => {
    if (!validateCurrent()) return
    setCompletedSteps(prev => new Set(prev).add(currentStep))
    setSubmitting(true)
    try {
      await onSubmit()
      setStepError(null)
    } catch (error) {
      // Without this a rejected submit leaves the form looking untouched
      setStepError(
        error instanceof Error ? error.message : 'Something went wrong'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const prefixLabel = prefix.toUpperCase()

  return (
    <div className={cn('w-full', className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep
        const isCompleted = completedSteps.has(index)

        return (
          <div key={index} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => handleStepClick(index)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 cursor-pointer hover:bg-muted/20',
                isActive ? 'bg-muted/40' : ''
              )}
            >
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                style={{
                  backgroundColor: isCompleted ? '#2081C3' : 'transparent',
                  borderColor: isCompleted || isActive ? '#2081C3' : '#9ca3af',
                  color: isCompleted
                    ? '#fff'
                    : isActive
                      ? '#2081C3'
                      : '#9ca3af',
                }}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Pencil className="w-3 h-3" />
                )}
              </div>

              <span
                className="text-sm font-semibold tracking-wide uppercase transition-colors duration-200"
                style={{
                  color: isActive || isCompleted ? '#2081C3' : '#6b7280',
                }}
              >
                <span className="font-bold">{prefixLabel} : </span>
                {step.title.toUpperCase()}
              </span>
            </button>

            <AnimatedStepContent isOpen={isActive}>
              <div className="px-6 py-5">
                {step.component}

                {stepError && (
                  <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600">
                    {stepError}
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 mt-8">
                  {index === 0 && onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      disabled={submitting || isLoading}
                      className="min-w-[100px]"
                    >
                      Cancel
                    </Button>
                  )}

                  {index > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={submitting || isLoading}
                      className="min-w-[100px]"
                      style={{ borderColor: '#2081C3', color: '#2081C3' }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                  )}

                  {isLast ? (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting || isLoading}
                      className="min-w-[100px] text-white"
                      style={{
                        backgroundColor: '#2081C3',
                        borderColor: '#2081C3',
                      }}
                    >
                      {(submitting || isLoading) && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {submitLabel}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={submitting || isLoading}
                      className="min-w-[100px] text-white"
                      style={{
                        backgroundColor: '#2081C3',
                        borderColor: '#2081C3',
                      }}
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </AnimatedStepContent>
          </div>
        )
      })}
    </div>
  )
}

export default MultiStepForm
