import Image from "next/image";
import { cn } from "@/lib/utils";

export function PhotoComingSoon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex size-full flex-col justify-between bg-secondary bg-kente p-5",
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-earth">Photo coming soon</p>
      <p className="font-heading text-2xl text-balance">{name}</p>
    </div>
  );
}

export function FoodPhoto({
  src,
  alt,
  name,
  priority = false,
  sizes,
  objectPosition,
  className,
}: {
  src?: string | null;
  alt: string;
  name: string;
  priority?: boolean;
  sizes: string;
  objectPosition?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          loading={priority ? undefined : "lazy"}
          sizes={sizes}
          className="object-cover"
          style={objectPosition ? { objectPosition } : undefined}
        />
      ) : (
        <PhotoComingSoon name={name} />
      )}
    </div>
  );
}
