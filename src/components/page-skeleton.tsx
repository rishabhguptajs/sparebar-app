// Shown at once while a page's data loads, so a click never looks like nothing happened.
export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse px-5 py-8 lg:px-10 lg:py-10" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 rounded-full bg-ink/[0.07]" />
      <div className="mt-3 h-4 w-80 max-w-full rounded-full bg-ink/[0.05]" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-52 rounded-3xl bg-ink/[0.05]" />
        ))}
      </div>
    </div>
  );
}
