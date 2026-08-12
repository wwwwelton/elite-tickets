import Image from "next/image";

export type EventPosterProps = {
  alt: string;
  priority?: boolean;
  src: string | null;
};

export function EventPoster({ alt, priority = false, src }: EventPosterProps) {
  if (!src) {
    return (
      <figure role="img" aria-label={`Pôster indisponível para ${alt}`} className="poster poster--empty">
        <span className="label-caps">Pôster indisponível</span>
      </figure>
    );
  }
  return (
    <figure className="poster">
      <Image
        src={src}
        alt={alt}
        width={500}
        height={750}
        priority={priority}
        sizes="(max-width: 767px) 100vw, 33vw"
        style={{ width: "100%", height: "auto" }}
      />
    </figure>
  );
}
