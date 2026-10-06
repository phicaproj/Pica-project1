import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import {
  R2_ACCESS_KEY_ID,
  R2_ACCOUNT_ID,
  R2_SECRET_ACCESS_KEY,
  BEAUVISION_R2_BUCKET,
  BEAUVISION_R2_PUBLIC_BASE_URL,
} from '../../Config/env';
import AppError from '../../service/shared/appError';
import { INTERNAL_SERVER_ERROR } from '../../service/shared/http';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export type UploadInput = {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
};

export type UploadResult = {
  key: string;
  url: string;
};

export const buildPublicUrl = (key: string): string => {
  const base = BEAUVISION_R2_PUBLIC_BASE_URL.replace(/\/+$/, '');
  const cleanKey = key.replace(/^\/+/, '');
  return `${base}/${cleanKey}`;
};

export const extractKeyFromUrl = (url: string): string | null => {
  if (!url) return null;
  const base = BEAUVISION_R2_PUBLIC_BASE_URL.replace(/\/+$/, '');
  if (url.startsWith(base)) {
    return url.substring(base.length).replace(/^\/+/, '');
  }
  return null;
};

export const uploadObject = async ({
  key,
  body,
  contentType,
  cacheControl = 'public, max-age=3600',
}: UploadInput): Promise<UploadResult> => {
  try {
    await r2Client.send(
      new PutObjectCommand({
        Bucket: BEAUVISION_R2_BUCKET,
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

export const deleteObject = async (key: string): Promise<void> => {
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: BEAUVISION_R2_BUCKET, Key: key }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown R2 delete error';
    throw new AppError(`Failed to delete from storage: ${message}`, INTERNAL_SERVER_ERROR);
  }
};
