import crypto from "crypto";

const algorithm = "aes-256-gcm";

export function generateKey() {
  return crypto.randomBytes(32); 
}

export function encryptMessage(message: string, key: Buffer) {
  const iv = crypto.randomBytes(12); 
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(message, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    content: encrypted,
    authTag: authTag.toString("base64"),
  };
}

export function decryptMessage(encryptedData: any, key: Buffer) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(encryptedData.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, "base64"));
  let decrypted = decipher.update(encryptedData.content, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
