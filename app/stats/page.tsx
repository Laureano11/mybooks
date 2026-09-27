import { getStats } from "@/lib/db";

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}

/** Barra horizontal: un div cuyo ancho es proporcional al máximo. */
function Bar({
  label,
  value,
  max,
}: {
  label: string | number;
  value: number;
  max: number;
}) {
  const pct = max === 0 ? 0 : (value / max) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted">
        {label}
      </span>
      <div className="h-5 flex-1 rounded-sm bg-surface">
        <div
          className="h-full rounded-sm bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 shrink-0 text-sm tabular-nums text-muted">
        {value}
      </span>
    </div>
  );
}

export const metadata = { title: "Estadísticas — Lauri Books" };

// Lee la base en cada request: si no, el build congelaría los números.
export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const stats = await getStats();

  if (stats.total === 0) {
    return <p className="py-16 text-center text-muted">Todavía no hay datos.</p>;
  }

  const maxHist = Math.max(...stats.histograma.map((h) => h.cantidad));
  const maxAnio = Math.max(...stats.porAnio.map((a) => a.cantidad), 0);

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Total" value={stats.total} />
        <Tile label="Leídos" value={stats.leidos} />
        <Tile label="Joyitas" value={stats.joyitas} />
        <Tile label="Promedio" value={stats.promedio ?? "—"} />
      </section>

      <section>
        <h2 className="mb-4 text-sm uppercase tracking-wide text-muted">
          Distribución de notas
        </h2>
        <div className="space-y-1.5">
          {stats.histograma.map((h) => (
            <Bar
              key={h.rating}
              label={h.rating}
              value={h.cantidad}
              max={maxHist}
            />
          ))}
        </div>
      </section>

      {stats.porAnio.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm uppercase tracking-wide text-muted">
            Libros por año
          </h2>
          <div className="space-y-1.5">
            {stats.porAnio.map((a) => (
              <Bar
                key={a.anio}
                label={a.anio}
                value={a.cantidad}
                max={maxAnio}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
