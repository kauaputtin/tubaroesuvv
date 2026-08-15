export default function AdminLoading() {
  return (
    <div className="animate-pulse" aria-label="Carregando página">
      <div className="h-4 w-28 rounded bg-slate-200" />
      <div className="mt-3 h-9 w-72 max-w-full rounded-lg bg-slate-200" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="mt-6 h-80 rounded-2xl border border-slate-200 bg-white" />
    </div>
  );
}
