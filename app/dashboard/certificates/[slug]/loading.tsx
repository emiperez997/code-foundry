export default function CertificateLoading() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10" role="status" aria-label="Cargando certificado">
      <div className="h-8 w-72 animate-pulse rounded bg-muted" />
      <div className="mt-6 h-40 animate-pulse rounded-lg bg-muted" />
    </div>
  )
}
