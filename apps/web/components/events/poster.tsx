import Image from "next/image";

export type EventPosterProps = {
  alt: string;
  priority?: boolean;
  src: string | null;
};

export function EventPoster({ alt, priority = false, src }: EventPosterProps) {
  if (!src) {
    return (
      <div role="img" aria-label={`Pôster indisponível para ${alt}`} className="ticket__section">
        <span className="label-caps">Pôster indisponível</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={500}
      height={750}
      priority={priority}
      sizes="(max-width: 767px) 100vw, 33vw"
      style={{ width: "100%", height: "auto" }}
    />
  );
}
