const axios = require("axios");
const crypto = require("crypto");
function createToken() {
  return crypto.randomBytes(32).toString("hex"); // Generates a 64-character hex token
}

function decodeJWT(token) {
  const base64Url = token.split(".")[1]; // Get the payload (second part of the token)
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/"); // Base64 adjustments
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  return JSON.parse(jsonPayload); // Parse the decoded payload as JSON
}
const setToken = (token) => {
  axios.defaults.headers.get["Authorization"] = "Bearer " + token;
  axios.defaults.headers.post["Authorization"] = "Bearer " + token;
  axios.defaults.headers.put["Authorization"] = "Bearer " + token;
};

module.exports = { setToken, createToken, decodeJWT };
