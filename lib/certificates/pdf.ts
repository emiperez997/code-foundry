import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib"
import { CERTIFICATE_ISSUER } from "./config"

/**
 * Helvetica estándar solo codifica WinAnsi. Normalizamos (NFC), quitamos controles y
 * sustituimos lo que no sea Latin-1 imprimible por "?" para que la generación nunca falle.
 */
export function sanitizePdfText(text: string): string {
  let out = ""
  for (const char of text.normalize("NFC").replace(/\s+/g, " ").trim()) {
    const code = char.codePointAt(0) as number
    out += (code >= 0x20 && code <= 0x7e) || (code >= 0xa1 && code <= 0xff) || char === " " ? char : "?"
  }
  return out
}

export type CertificatePdfData = {
  recipientName: string
  courseTitle: string
  issuedAt: Date
  code: string
  verifyUrl: string
  revoked?: boolean
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ""
  const push = (word: string) => {
    // palabras más largas que la línea se parten por caracteres
    let rest = word
    while (font.widthOfTextAtSize(rest, size) > maxWidth && rest.length > 1) {
      let n = rest.length - 1
      while (n > 1 && font.widthOfTextAtSize(rest.slice(0, n), size) > maxWidth) n--
      lines.push(rest.slice(0, n))
      rest = rest.slice(n)
    }
    line = rest
  }
  for (const word of text.split(" ")) {
    const candidate = line ? `${line} ${word}` : word
    if (!line || font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      if (!line && font.widthOfTextAtSize(word, size) > maxWidth) push(word)
      else line = candidate
    } else {
      lines.push(line)
      line = ""
      if (font.widthOfTextAtSize(word, size) > maxWidth) push(word)
      else line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

export async function generateCertificatePdf(data: CertificatePdfData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle("Certificado CodeFoundry")
  pdf.setProducer(CERTIFICATE_ISSUER)
  const page = pdf.addPage([842, 595]) // A4 apaisado
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const { width } = page.getSize()
  const maxWidth = width - 160
  const ink = rgb(0.1, 0.1, 0.12)
  const muted = rgb(0.32, 0.32, 0.36)

  const center = (text: string, y: number, size: number, font: PDFFont, color = ink) =>
    page.drawText(text, { x: (width - font.widthOfTextAtSize(text, size)) / 2, y, size, font, color })

  // Texto que se reduce de tamaño y, si hace falta, se ajusta en líneas.
  const fitted = (raw: string, y: number, start: number, min: number, font: PDFFont): number => {
    const text = sanitizePdfText(raw) || "?"
    let size = start
    while (size > min && font.widthOfTextAtSize(text, size) > maxWidth) size -= 1
    const lines = wrap(text, font, size, maxWidth).slice(0, 3)
    lines.forEach((line, i) => center(line, y - i * (size + 4), size, font))
    return y - lines.length * (size + 4)
  }

  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: 595 - 48, borderColor: rgb(0.2, 0.2, 0.25), borderWidth: 2 })
  center(sanitizePdfText(CERTIFICATE_ISSUER), 520, 20, bold)
  center("CERTIFICADO DE APROBACIÓN", 480, 14, regular, muted)
  center("Se certifica que", 430, 14, regular, muted)
  let y = fitted(data.recipientName, 390, 34, 16, bold)
  center("aprobó el curso", y - 12, 14, regular, muted)
  y = fitted(data.courseTitle, y - 50, 26, 14, bold)
  const date = data.issuedAt.toISOString().slice(0, 10)
  center(`Fecha de emisión: ${date}`, y - 30, 12, regular, muted)
  center(`Emitido por ${sanitizePdfText(CERTIFICATE_ISSUER)}`, y - 48, 12, regular, muted)

  center(`Código de verificación: ${sanitizePdfText(data.code)}`, 95, 12, bold)
  center(`Verifica en: ${sanitizePdfText(data.verifyUrl)}`, 75, 10, regular, muted)
  if (data.revoked) center("CERTIFICADO REVOCADO", 50, 12, bold, rgb(0.6, 0, 0))
  return pdf.save()
}
