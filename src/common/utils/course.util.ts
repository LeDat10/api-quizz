import slugify from 'slugify';
import { randomBytes } from 'crypto';
export const generateSlug = (title: string): string => {
  const slug = slugify(title, { lower: true, strict: true });
  return slug;
};

export const generateRadomString = (length = 5): string => {
  return randomBytes(length).toString('base64url').substring(0, length);
};

export const generateRadomUppercaseString = (length = 7): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * chars.length);
    result += chars[index];
  }
  return result;
};
