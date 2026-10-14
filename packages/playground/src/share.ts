/**
 * The share format: a set of files and a title as a compact, URL-safe
 * string, for addresses like `/playground/#code=<payload>`.
 *
 * `1.` (the format version), then base64url of the deflate-raw compression
 * (`CompressionStream`, built into browsers and Node) of the JSON.
 */
import type { PlaygroundFiles } from './types.ts';

export interface SharedCode {
  files: PlaygroundFiles;
  title?: string;
}

const VERSION = '1.';

async function pipe(bytes: Uint8Array, stream: GenericTransformStream) {
  const output = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(output).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(text: string) {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

/** Encodes files (and a title) into a share payload. */
export async function encodeShare(code: SharedCode): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(code));
  const compressed = await pipe(json, new CompressionStream('deflate-raw'));
  return VERSION + toBase64Url(compressed);
}

/**
 * Decodes a share payload. Throws an `Error` with a readable message for an
 * unknown version or input that doesn't decode to files.
 */
export async function decodeShare(payload: string): Promise<SharedCode> {
  if (!payload.startsWith(VERSION)) {
    throw new Error('This code link is from a newer or unknown version.');
  }
  let code: unknown;
  try {
    const bytes = fromBase64Url(payload.slice(VERSION.length));
    const json = await pipe(bytes, new DecompressionStream('deflate-raw'));
    code = JSON.parse(new TextDecoder().decode(json));
  } catch {
    throw new Error('This code link is incomplete or damaged.');
  }
  const { files, title } = (code ?? {}) as Partial<SharedCode>;
  if (
    !files ||
    typeof files !== 'object' ||
    !Object.values(files).every(content => typeof content === 'string')
  ) {
    throw new Error('This code link has no files.');
  }
  return { files, ...(typeof title === 'string' && { title }) };
}
