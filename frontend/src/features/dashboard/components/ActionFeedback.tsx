interface ActionFeedbackProps {
  type: 'success' | 'error'
  message: string
}

export const ActionFeedback: React.FC<ActionFeedbackProps> = ({ type, message }) => {
  const classes =
    type === 'success'
      ? 'border-emerald-300/30 bg-emerald-500/10 text-emerald-100'
      : 'border-red-300/30 bg-red-500/10 text-red-100'

  return <p className={`rounded-lg border px-3 py-2 text-xs ${classes}`}>{message}</p>
}
