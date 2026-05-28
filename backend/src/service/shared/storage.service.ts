import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import {
  R2_ACCESS_KEY_ID,
  R2_ACCOUNT_ID,
  R2_BUCKET,
  R2_PUBLIC_BASE_URL,
  R2_SECRET_ACCESS_KEY,
} from '../../Config/env';
import AppError from './appError';
import { INTERNAL_SERVER_ERROR } from './http';

/**
 * Thin Cloudflare R2 wrapper. R2 speaks the S3 API so we use the AWS SDK
 * pointed at the account-scoped R2 endpoint. Three responsibilities:
 *   1. Upload a buffer (PDF, image, etc.) and return the public URL.
 *   2. Delete an object by key.
 *   3. Build the public URL for an existing key.
 *
 * Public delivery: callers should configure R2_PUBLIC_BASE_URL to either the
 * bucket's r2.dev subdomain or a custom domain bound to the bucket. Objects
 * stored here are publicly downloadable by anyone holding the URL — protect
 * by using unguessable keys (UUIDs) rather than ACLs.
 */

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export type UploadInput = {
  /** Object key inside the bucket, e.g. `reports/phase1/<sessionId>.pdf`. */
  key: string;
  body: Buffer;
  contentType: string;
  /** Optional cache header to attach. Defaults to one hour for PDFs. */
  cacheControl?: string;
};

export type UploadResult = {
  key: string;
  url: string;
};

/**
 * Build a public URL for an object key. Does not check that the object
 * actually exists — pair with uploadObject() or list to confirm.
 */
export const buildPublicUrl = (key: string): string => {
  const base = R2_PUBLIC_BASE_URL.replace(/\/+$/, '');
  const cleanKey = key.replace(/^\/+/, '');
  return `${base}/${cleanKey}`;
};

/** Upload an arbitrary buffer to R2 and return the public URL. */
export const uploadObject = async ({
  key,
  body,
  contentType,
  cacheControl = 'public, max-age=3600',
}: UploadInput): Promise<UploadResult> => {
  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: cacheControl,
      })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown R2 upload error';
    throw new AppError(`Failed to upload to storage: ${message}`, INTERNAL_SERVER_ERROR);
  }

  return { key, url: buildPublicUrl(key) };
};

/** Convenience wrapper for PDF uploads — sets the right content type. */
export const uploadPdf = async (
  key: string,
  body: Buffer
): Promise<UploadResult> =>
  uploadObject({
    key,
    body,
    contentType: 'application/pdf',
    cacheControl: 'private, max-age=300',
  });

/** Convenience wrapper for Avatar uploads — sets the right content type. */
export const uploadAvatar = async (
  key: string,
  body: Buffer,
  contentType: string
): Promise<UploadResult> =>
  uploadObject({
    key,
    body,
    contentType,
    cacheControl: 'public, max-age=86400', // Cache for 24 hours
  });

/** Delete an object by key. Safe to call for keys that don't exist (R2 returns 204). */
export const deleteObject = async (key: string): Promise<void> => {
  try {
    await r2Client.send(
      new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown R2 delete error';
    throw new AppError(`Failed to delete from storage: ${message}`, INTERNAL_SERVER_ERROR);
  }
};
