/** Güvenlik denetimi bulgusu: dosya tipi daha önce sadece `file.name`
 * uzantısı / attacker-controlled `file.type`'a göre belirleniyordu — bir
 * kullanıcı `image/svg+xml` içerikli, içine script gömülü bir dosyayı
 * ".jpg" adıyla yükleyip Storage'a `Content-Type: image/svg+xml` olarak
 * kaydettirebiliyordu (özellikle public `business_logos` bucket'ında).
 * Bu fonksiyon dosyanın gerçek ilk baytlarına (magic number) bakarak
 * sadece JPEG/PNG/WebP'ye izin verir — uzantı/MIME adı hiç güvenilmez. */

export interface DetectedImageType {
  mime: "image/jpeg" | "image/png" | "image/webp";
  ext: "jpg" | "png" | "webp";
}

const SIGNATURES: { mime: DetectedImageType["mime"]; ext: DetectedImageType["ext"]; bytes: number[] }[] = [
  { mime: "image/jpeg", ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/webp", ext: "webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"; WEBP tag verified separately at offset 8
];

/** Reads the first 12 bytes of the file and matches against known image
 * signatures. Returns null if the file isn't a real JPEG/PNG/WebP. */
export async function detectImageType(file: File): Promise<DetectedImageType | null> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  for (const sig of SIGNATURES) {
    if (!sig.bytes.every((b, i) => head[i] === b)) continue;
    if (sig.mime === "image/webp") {
      const webpTag = String.fromCharCode(head[8], head[9], head[10], head[11]);
      if (webpTag !== "WEBP") continue;
    }
    return { mime: sig.mime, ext: sig.ext };
  }
  return null;
}
