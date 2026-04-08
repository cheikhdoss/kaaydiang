import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-center">
    <p className="mb-4 text-sm text-red-100">{message}</p>
    <Button className="bg-[#3054ff] text-white hover:bg-[#2445e8]" onClick={onRetry}>
      Reessayer
    </Button>
  </div>
)
