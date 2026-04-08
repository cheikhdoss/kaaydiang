interface LoadingStateProps {
  fullscreen?: boolean
}

export const LoadingState: React.FC<LoadingStateProps> = ({ fullscreen = false }) => (
  <div className={fullscreen ? 'flex min-h-screen items-center justify-center' : 'flex min-h-[50vh] items-center justify-center'}>
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#3054ff]" />
  </div>
)
