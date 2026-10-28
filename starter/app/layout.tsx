export const metadata = {
  title: "Notas — base del curso de autenticación",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: "2rem auto", maxWidth: 640 }}>
        {children}
      </body>
    </html>
  );
}
