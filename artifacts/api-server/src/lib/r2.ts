import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const REQUIRED_ENV = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME", "R2_PUBLIC_URL"] as const;

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`${key} must be set. Did you forget to configure Cloudflare R2?`);
  }
}

const accountId = process.env.R2_ACCOUNT_ID!;
const bucketName = process.env.R2_BUCKET_NAME!;
// Public base URL for the bucket — either the R2.dev dev URL or a custom domain
// mapped to the bucket, WITHOUT a trailing slash. e.g. https://pub-xxxx.r2.dev
const publicBaseUrl = process.env.R2_PUBLIC_URL!.replace(/\/+$/, "");

export const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function randomFilename(originalname: string): string {
  const ext = originalname.includes(".") ? originalname.slice(originalname.lastIndexOf(".")) : "";
  return `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
}

/**
 * Uploads a buffer (from multer memoryStorage) to R2 under `subdir/` and
 * returns the public URL for the stored object.
 */
export async function uploadBufferToR2(
  subdir: string,
  file: { buffer: Buffer; originalname: string; mimetype: string },
): Promise<{ key: string; url: string }> {
  const filename = randomFilename(file.originalname);
  const key = `${subdir}/${filename}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return { key, url: `${publicBaseUrl}/${key}` };
}
