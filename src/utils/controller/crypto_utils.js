// Step 4: Decrypt the password using AES-GCM
const crypto = require("crypto");
function decryptPassword(encryptedPasswordBase64, ivBase64, sharedSecret) {
  console.log(encryptedPasswordBase64, ivBase64, sharedSecret);
  // Step 1: Derive shared secret
  // const serverECDH = crypto.createECDH("prime256v1");
  // // const serverPublicKey = serverECDH.generateKeys(); // Ignore the server public key for now
  // const clientPublicKey = Buffer.from(clientPublicKeyHex, "hex");

  // Compute the shared secret using the client's public key
  // const sharedSecret = serverECDH.computeSecret(clientPublicKey);
  console.log("sharedSecret:", sharedSecret);
  // Step 2: Derive AES key from the shared secret
  const aesKey = crypto.createHash("sha256").update(sharedSecret).digest(); // SHA-256 hash to derive a 256-bit key
  console.log("aesKey:", aesKey);
  // Step 3: Convert the IV and the encrypted password from Base64
  const iv = Buffer.from(ivBase64, "base64");
  console.log("iv:", iv);

  const encryptedPassword = Buffer.from(encryptedPasswordBase64, "base64");
  console.log("encryptedPassword:", encryptedPassword);

  // Step 4: Decrypt the password using AES-GCM
  const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
  console.log("decipher:", decipher);

  // Decrypt the password
  let decryptedPassword = decipher.update(encryptedPassword, null, "utf8");
  console.log("decryptedPassword1:", decryptedPassword);

  // Complete the decryption
  decryptedPassword += decipher.final("utf8");
  console.log("decryptedPassword2:", decryptedPassword);

  return decryptedPassword;
}

module.exports = { decryptPassword };
