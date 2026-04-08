import { useState } from 'react'
import { motion } from 'framer-motion'
import { CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const ProgressIndicator = () => {
  const [step, setStep] = useState(1)
  const [isExpanded, setIsExpanded] = useState(true)

  const handleContinue = () => {
    if (step < 3) {
      setStep(step + 1)
      setIsExpanded(false)
    }
  }

  const handleBack = () => {
    if (step === 2) {
      setIsExpanded(true)
    }
    if (step > 1) {
      setStep(step - 1)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="relative flex items-center gap-6">
        {[1, 2, 3].map((dot) => (
          <div
            key={dot}
            className={cn(
              'relative z-10 h-2 w-2 rounded-full',
              dot <= step ? 'bg-white' : 'bg-gray-300'
            )}
          />
        ))}

        <motion.div
          initial={{ width: '12px', height: '24px', x: 0 }}
          animate={{
            width: step === 1 ? '24px' : step === 2 ? '60px' : '96px',
            x: 0,
          }}
          className="absolute -left-[8px] -top-[8px] h-3 -translate-y-1/2 rounded-full bg-green-500"
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            mass: 0.8,
            bounce: 0.25,
            duration: 0.6,
          }}
        />
      </div>

      <div className="w-full max-w-sm">
        <motion.div
          className="flex items-center gap-1"
          animate={{
            justifyContent: isExpanded ? 'stretch' : 'space-between',
          }}
        >
          {!isExpanded && (
            <motion.button
              initial={{ opacity: 0, width: 0, scale: 0.8 }}
              animate={{ opacity: 1, width: '64px', scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 15,
                mass: 0.8,
                bounce: 0.25,
                duration: 0.6,
                opacity: { duration: 0.2 },
              }}
              onClick={handleBack}
              className="w-16 flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm font-semibold text-black transition-colors hover:border hover:bg-gray-50"
            >
              Back
            </motion.button>
          )}
          <motion.button
            onClick={handleContinue}
            animate={{
              flex: isExpanded ? 1 : 'inherit',
            }}
            className={cn(
              'w-56 flex-1 rounded-full bg-[#006cff] px-4 py-3 text-white transition-colors',
              !isExpanded && 'w-44'
            )}
          >
            <div className="flex items-center justify-center gap-2 text-sm font-[600]">
              {step === 3 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 15,
                    mass: 0.5,
                    bounce: 0.4,
                  }}
                >
                  <CircleCheck size={16} />
                </motion.div>
              )}
              {step === 3 ? 'Finish' : 'Continue'}
            </div>
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export default ProgressIndicator
