import { AIXUNO_SITES, CURRENT_SITE } from "@/config/sites";

export function SiteNetwork() {
  return (
    <section aria-label="Aixuno 工具" className="mt-8 border-t pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Aixuno 工具</p>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {AIXUNO_SITES.map((site) => (
            <li key={site.id}>
              {site.id === CURRENT_SITE ? (
                <span aria-current="page" className="font-medium text-gray-900">
                  {site.label}
                </span>
              ) : (
                <a href={site.href} className="text-gray-500 transition-colors hover:text-primary">
                  {site.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
