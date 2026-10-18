const images = import.meta.glob<string>("./assets/artwork/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
});
const widths = [160, 320, 480] as const;

export function uiArtwork(name: string, sizes: string) {
  const source = (width: number) => {
    const url = images[`./assets/artwork/${name}-${width}.webp`];
    if (!url) throw new Error(`Fehlende Illustration: ${name}, ${width}`);
    return url;
  };
  return {
    src: source(320),
    srcSet: widths.map((width) => `${source(width)} ${width}w`).join(", "),
    sizes,
  };
}
