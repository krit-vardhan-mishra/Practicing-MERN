import nacl from "tweetnacl";
import { decodeUTF8, encodeUTF8, encodeBase64, decodeBase64 } from "tweetnacl-util";

// Generate a new key pair for the user
export function generateKeyPair() {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  };
}

// Encrypt a message using the recipient's public key and sender's secret key
export function encryptMessage(
  message: string,
  recipientPublicKey: string,
  senderSecretKey: string
): { encrypted: string; nonce: string } {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageUint8 = decodeUTF8(message);
  const recipientPublicKeyUint8 = decodeBase64(recipientPublicKey);
  const senderSecretKeyUint8 = decodeBase64(senderSecretKey);

  const encrypted = nacl.box(
    messageUint8,
    nonce,
    recipientPublicKeyUint8,
    senderSecretKeyUint8
  );

  if (!encrypted) {
    throw new Error("Encryption failed");
  }

  return {
    encrypted: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };
}

// Decrypt a message using the sender's public key and recipient's secret key
export function decryptMessage(
  encryptedMessage: string,
  nonce: string,
  senderPublicKey: string,
  recipientSecretKey: string
): string {
  const encryptedUint8 = decodeBase64(encryptedMessage);
  const nonceUint8 = decodeBase64(nonce);
  const senderPublicKeyUint8 = decodeBase64(senderPublicKey);
  const recipientSecretKeyUint8 = decodeBase64(recipientSecretKey);

  const decrypted = nacl.box.open(
    encryptedUint8,
    nonceUint8,
    senderPublicKeyUint8,
    recipientSecretKeyUint8
  );

  if (!decrypted) {
    throw new Error("Decryption failed");
  }

  return encodeUTF8(decrypted);
}

// Decrypt using a precomputed shared key so either party (you + other user) can decrypt
// with their own secret key and the other party's public key.
export function decryptMessageWithOtherPublic(
  encryptedMessage: string,
  nonce: string,
  otherPublicKey: string,
  mySecretKey: string
): string {
  const encryptedUint8 = decodeBase64(encryptedMessage);
  const nonceUint8 = decodeBase64(nonce);
  const otherPublicKeyUint8 = decodeBase64(otherPublicKey);
  const mySecretKeyUint8 = decodeBase64(mySecretKey);

  // Compute shared key between me (secret) and other (public)
  const sharedKey = nacl.box.before(otherPublicKeyUint8, mySecretKeyUint8);
  const decrypted = nacl.box.open.after(encryptedUint8, nonceUint8, sharedKey);

  if (!decrypted) {
    throw new Error("Decryption failed");
  }

  return encodeUTF8(decrypted);
}

// Store keys in localStorage
export function storeKeys(publicKey: string, secretKey: string) {
  localStorage.setItem("publicKey", publicKey);
  localStorage.setItem("secretKey", secretKey);
}

// Retrieve keys from localStorage
export function getKeys(): { publicKey: string; secretKey: string } | null {
  const publicKey = localStorage.getItem("publicKey");
  const secretKey = localStorage.getItem("secretKey");

  if (!publicKey || !secretKey) {
    return null;
  }

  return { publicKey, secretKey };
}

// Clear keys from localStorage
export function clearKeys() {
  localStorage.removeItem("publicKey");
  localStorage.removeItem("secretKey");
}
