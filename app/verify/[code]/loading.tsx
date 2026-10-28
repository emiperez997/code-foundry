export default function VerifyLoading() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10" role="status" aria-label="Verificando certificado">
      <div className="h-8 w-64 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-32 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}
