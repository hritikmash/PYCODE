import crypto from 'crypto';
import QRCode from 'qrcode';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(str: string): Buffer {
  const clean = str.toUpperCase().replace(/=+$/, '').replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_CHARS.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/**
 * Generates an RFC 6238 TOTP code for a given base32 secret and timestamp.
 */
export function generateTotp(secretBase32: string, timeMs: number = Date.now()): string {
  const key = base32Decode(secretBase32);
  const timeStep = Math.floor(timeMs / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(timeStep), 0);
  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code against a secret key with +/- 1 step (30s) drift window.
 */
export function verifyTotp(secretBase32: string, token: string, timeMs: number = Date.now()): boolean {
  if (!secretBase32 || !token) return false;
  const cleanToken = token.trim();
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) return false;

  for (let step = -1; step <= 1; step++) {
    const candidate = generateTotp(secretBase32, timeMs + step * 30000);
    if (candidate === cleanToken) return true;
  }
  return false;
}

/**
 * Generates emergency 8-character backup recovery codes.
 */
export function generateBackupCodes(count: number = 5): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`${p1}-${p2}`);
  }
  return codes;
}

export interface GoogleAuthenticatorSetup {
  secret: string; // Base32 secret string (formatted with spaces for readability)
  rawSecret: string; // Pure Base32 secret string
  otpauthUri: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

/**
 * Creates Google Authenticator setup parameters including Base32 secret,
 * standard otpauth:// URI, QR code data URL, and emergency backup codes.
 */
export async function createGoogleAuthenticatorSetup(
  userEmail: string,
  issuer: string = 'Pycode'
): Promise<GoogleAuthenticatorSetup> {
  // 20 bytes is standard for Google Authenticator (160-bit secret)
  const rawBytes = crypto.randomBytes(20);
  const rawSecret = base32Encode(rawBytes);

  // Format secret with spaces for easier manual entry in Google Authenticator: "XXXX XXXX XXXX XXXX"
  const formattedSecret = rawSecret.match(/.{1,4}/g)?.join(' ') || rawSecret;

  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(userEmail.trim().toLowerCase());
  const otpauthUri = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${rawSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 240,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  const backupCodes = generateBackupCodes(5);

  return {
    secret: formattedSecret,
    rawSecret,
    otpauthUri,
    qrCodeDataUrl,
    backupCodes
  };
}
