export function LoadingLogo({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Legacy loader (spinner) */}
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      {label ? <p className="mt-4 text-text-secondary">{label}</p> : null}
    </div>
  );
}
