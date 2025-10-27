import express from "express";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";

const router = express.Router();

// Store keypairs temporarily (in production store privateKey securely)
const userKeyPairs: Record<string, nacl.BoxKeyPair> = {};

// Initialize a keypair for each user
router.post("/init", (req, res) => {
  const { userId } = req.body;
  const keyPair = nacl.box.keyPair();
  userKeyPairs[userId] = keyPair;
  res.json({
    message: "Keypair initialized",
    publicKey: naclUtil.encodeBase64(keyPair.publicKey),
  });
});

// Encrypt a message using receiver’s public key
router.post("/send", (req, res) => {
  const { senderId, receiverId, message, receiverPublicKey } = req.body;
  const senderKeys = userKeyPairs[senderId];
  if (!senderKeys) return res.status(400).json({ error: "Sender not initialized" });

  const nonce = nacl.randomBytes(24);
  const encrypted = nacl.box(
    naclUtil.decodeUTF8(message),
    nonce,
    naclUtil.decodeBase64(receiverPublicKey),
    senderKeys.secretKey
  );

  res.json({
    nonce: naclUtil.encodeBase64(nonce),
    encrypted: naclUtil.encodeBase64(encrypted),
    senderPublicKey: naclUtil.encodeBase64(senderKeys.publicKey),
  });
});

// Decrypt message using receiver’s private key
router.post("/receive", (req, res) => {
  const { receiverId, senderPublicKey, nonce, encrypted } = req.body;
  const receiverKeys = userKeyPairs[receiverId];
  if (!receiverKeys) return res.status(400).json({ error: "Receiver not initialized" });

  const decrypted = nacl.box.open(
    naclUtil.decodeBase64(encrypted),
    naclUtil.decodeBase64(nonce),
    naclUtil.decodeBase64(senderPublicKey),
    receiverKeys.secretKey
  );

  if (!decrypted) return res.status(400).json({ error: "Failed to decrypt" });

  res.json({ message: naclUtil.encodeUTF8(decrypted) });
});

export default router;
