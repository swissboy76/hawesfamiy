// Public historical images only. The R2 bucket itself remains private.
// Add new filenames deliberately: a random object uploaded to R2 must not
// become publicly readable simply because its key is known.
const PUBLIC_IMAGES = new Set([
  "william-hawes.jpg",
  "eric-kathleen-wedding.jpg",
  "royal-silver-wedding-1972-eric-hawes.jpg",
  "george-hawes-kenya-1956.jpg",
  "walter-hawes-pension-particulars.jpg",
  "william-hawes-1785-baptism-extract.jpg",
  "william-hawes-elizabeth-mullinex-marriage-1805.jpg",
  "william-hawes-chapel-royal-envelope.jpg",
  "1840-wheatley-letter-to-william-hawes.jpg",
  "1845-mount-edgcumbe-hawes-letter-page-1.jpg",
  "1845-mount-edgcumbe-hawes-letter-page-2.jpg",
  "1916-hawes-fairy-play-cover.jpg",
  "1916-hawes-enchanted-rose-cast.jpg"
]);

export async function onRequestGet(context) {
  const name = context.params.filename;
  if (typeof name !== "string" || !PUBLIC_IMAGES.has(name)) {
    return new Response("Not found", { status: 404 });
  }
  const bucket = context.env.ARCHIVE;
  if (!bucket) return new Response("Archive storage is not configured", { status: 503 });
  try {
    // Keys are stored at the root of R2, with these exact filenames.
    const object = await bucket.get(name);
    if (!object) return new Response("Image not yet uploaded", { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Content-Type", "image/jpeg");
    headers.set("Cache-Control", "public, max-age=3600");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Content-Security-Policy", "default-src 'none'; sandbox");
    if (object.httpEtag) headers.set("ETag", object.httpEtag);
    return new Response(object.body, { headers });
  } catch (error) {
    console.error("Historical image retrieval failed", error);
    return new Response("Unable to retrieve image", { status: 502 });
  }
}

export async function onRequestHead(context) {
  const res = await onRequestGet(context);
  return new Response(null, { status: res.status, headers: res.headers });
}
