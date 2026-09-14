import { Link } from "@tanstack/react-router";
import { SoundToggle } from "./SoundToggle";
import { sfx } from "@/lib/audio";

type Props = {
  title: string;
  subtitle?: string;
  backTo?: string;
  backParams?: Record<string, string>;
};

const BackLink = Link as unknown as React.ComponentType<{
  to: string;
  params: Record<string, string>;
  onClick: () => void;
  className: string;
  "aria-label": string;
  children: React.ReactNode;
}>;

export function PageHeader({ title, subtitle, backTo, backParams }: Props) {
  return (
    <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 pb-4">
      {backTo ? (
        <BackLink
          to={backTo}
          params={backParams ?? {}}
          onClick={() => sfx.tap()}
          className="tap-pop grid h-11 w-11 shrink-0 place-items-center rounded-full bg-card text-xl shadow-soft"
          aria-label="Kembali"
        >
          ←
        </BackLink>
      ) : (
        <span className="h-11 w-11" />
      )}
      <div className="min-w-0 text-center">
        <h1 className="truncate font-display text-2xl font-extrabold">{title}</h1>
        {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      <SoundToggle />
    </header>
  );
}
