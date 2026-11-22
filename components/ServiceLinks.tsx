/** الخدمات التي يرتبط بها الموقع — تُفتح لوحاتها من هنا مباشرة */

type Service = { name: string; href: string; icon: React.ReactNode };

const GitHubIcon = (
  <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.19c0 .21.15.46.55.38A8 8 0 0 0 8 0Z" />
);

const VercelIcon = <path d="M8 1.5 15 14H1L8 1.5Z" />;

const SupabaseIcon = (
  <path d="M9.3 1.2c.5-.6 1.5-.2 1.5.6v4.4h3.4c.9 0 1.3 1 .8 1.6l-6.3 7c-.5.6-1.5.2-1.5-.6V9.8H3.8c-.9 0-1.3-1-.8-1.6l6.3-7Z" />
);

const CloudinaryIcon = (
  <path d="M12.3 6.5A4.1 4.1 0 0 0 4.4 5.6 3.4 3.4 0 0 0 4.7 13H12a3.3 3.3 0 0 0 .3-6.5Z" />
);

const SERVICES: Service[] = [
  { name: "GitHub", href: "https://github.com/m7nmri-byte/7", icon: GitHubIcon },
  { name: "Vercel", href: "https://vercel.com/m79/7", icon: VercelIcon },
  {
    name: "Supabase",
    href: "https://supabase.com/dashboard/project/xurwrfebtydbrkflxiqw",
    icon: SupabaseIcon,
  },
  { name: "Cloudinary", href: "https://console.cloudinary.com/console", icon: CloudinaryIcon },
];

export function ServiceLinks() {
  return (
    <div className="flex items-center gap-1 px-2">
      {SERVICES.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noreferrer"
          title={s.name}
          aria-label={s.name}
          className="rounded-lg p-2 text-faint transition-colors hover:bg-card hover:text-ink"
        >
          <svg viewBox="0 0 16 16" aria-hidden className="size-4" fill="currentColor">
            {s.icon}
          </svg>
        </a>
      ))}
    </div>
  );
}
