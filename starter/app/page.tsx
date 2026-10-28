export default function Home() {
  return (
    <main>
      <h1>Notas</h1>
      <p>
        Esta aplicación todavía no tiene login. Consulta el <code>README.md</code> para ver cómo
        probar la API y qué debes construir en cada módulo del curso.
      </p>
      <ul>
        <li>
          <code>GET /api/notes</code> — lista las notas de la persona indicada en <code>X-User-Id</code>.
        </li>
        <li>
          <code>GET /api/notes/:id</code> — devuelve una nota por su id.
        </li>
      </ul>
    </main>
  );
}
