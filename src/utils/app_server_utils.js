const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const axios = require("axios");
const cors = require("cors");
const session = require("express-session");
const Keycloak = require("keycloak-connect");

const app = express();
// configure port of app server
const PORT = 3000;
app.use(bodyParser.json());
app.use(cors());

/**
 * Keycloak setup
 */
// Set up express-session to manage sessions
const memoryStore = new session.MemoryStore();
app.use(
  session({
    secret: "2f7eb4f2d9c5f37819e8f8a1e9ed04bfed207fce217a4f75d66ca2bd8d96683d",
    resave: false,
    saveUninitialized: true,
    store: memoryStore,
  })
);

// Initialize Keycloak middleware
const keycloak = new Keycloak(
  { store: memoryStore },
  {
    realm: "debugtrail",
    "auth-server-url": "https://us1-dev.fohik.com/auth",
    "ssl-required": "external",
    resource: "node-api-client",
    credentials: {
      secret: "your-client-secret",
    },
    "confidential-port": 0,
  }
);

// Apply Keycloak middleware
app.use(keycloak.middleware());

/**
 * Database setup
 */
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { auth_url } = require("./configs");
const { setToken, createToken, decodeJWT } = require("./controller/helper");
const { decryptPassword } = require("./controller/crypto_utils");
// const uri =
//   "mongodb+srv://salimkt25:Oc6ShumcbZkcNdpT@cluster0.hlnc7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const uri =
  "mongodb+srv://salimkt25:Oc6ShumcbZkcNdpT@cluster0.hlnc7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
let db;
client
  .connect()
  .then((client) => {
    db = client.db(client.db.name);
    console.log(`Connected to database: ${client.db.name}`);
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

/**
 * Encryption config
 */
// Step 1: Generate Diffie-Hellman keys on the server

const serverECDH = crypto.createECDH("prime256v1");
const serverPublicKey = serverECDH.generateKeys("hex");

function deriveSharedSecret(clientPublicKeyHex) {
  // const serverECDH = crypto.createECDH("prime256v1");
  // const serverPublicKey = serverECDH.generateKeys("hex"); // Generate server key pair

  // Client's public key received as a hex string
  const clientPublicKey = Buffer.from(clientPublicKeyHex, "hex");

  // Compute the shared secret using the server's private key and client's public key
  const sharedSecret = serverECDH.computeSecret(clientPublicKey);

  return sharedSecret; // Use this shared secret for AES decryption
}

//Flags
let acc_timeout = null;
let refresh_timeout = null;
let token = {
  access_token: "",
  expires_in: 60,
  refresh_expires_in: 59940,
  refresh_token: "",
};

const startAppServer = () => {
  app.post("/key_exchange", async (req, res) => {
    const { username, p_key } = req.body;
    const serverSharedSecret = deriveSharedSecret(p_key);
    console.log(serverSharedSecret.toString("hex"));

    const existingUser = await db
      .collection("public_key")
      .findOne({ username });
    if (existingUser) {
      const result = await db
        .collection("public_key")
        .updateOne({ username }, { $set: { p_key } });
      // result ? res.status(200).json("success") : res.status(400).json("failed");
    } else {
      const result = await db.collection("public_key").insertOne(req.body);
      // result ? res.status(200).json("success") : res.status(400).json("failed");
    }
    // const serverPublicKey = serverDH.generateKeys();
    res.json({ serverPublicKey: serverPublicKey.toString("hex") });
  });
  // POST endpoint to handle login
  app.post("/signin", async (req, res) => {
    const { username, password, iv } = req.body;
    const key = await db.collection("public_key").findOne({ username });

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    try {
      // try {
      //   const pwd = decryptPassword(
      //     password,
      //     iv,
      //     deriveSharedSecret(key.p_key)
      //   );
      //   console.log(pwd);
      // } catch (e) {
      //   console.log(JSON.stringify(e));
      // }

      // Make a request to Keycloak's token endpoint
      const response = await axios.post(
        auth_url + "debugtrail" + "/protocol/openid-connect/token",
        {
          client_id: "debugtrail",
          grant_type: "password",
          username: username,
          password: password,
        },
        { headers }
      );
      const existingUser = await db.collection("users").findOne({ username });
      // Send back the access and refresh tokens
      res.json({ ...response.data, ...existingUser });
    } catch (error) {
      res.status(400).json({
        data: error.response,
        error: "Invalid credentials",
      });
    }
  });

  app.post("/signup", async (req, res) => {
    const { username, email, firstName, lastName, companyName, password } =
      req.body;
    if (!acc_timeout) {
      await generateToken();
    }
    // if (!acc_timeout) res.status(500).json("server token generate failed");
    try {
      // Check if the user already exists
      const existingUser = await db
        .collection("users")
        .findOne({ username, email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      } else {
        const respons = await axios.post(
          "https://us1-dev.fohik.com/auth/admin/realms/debugtrail/users",
          {
            username,
            enabled: true,
            firstName,
            email,
            emailVerified: true,
            lastName,
          }
        );

        const response = await axios.get(
          "https://us1-dev.fohik.com/auth/admin/realms/debugtrail/users"
        );

        const user = response.data.filter((user) => user.username == username);

        await axios.put(
          `https://us1-dev.fohik.com/auth/admin/realms/debugtrail/users/${user[0].id}/reset-password`,
          {
            type: "password",
            value: password,
            temporary: false,
          }
        );
        delete req.body?.password;
        // Insert the user into the database
        const result = await db
          .collection("users")
          .insertOne({ ...req.body, uuid: user[0].id });

        // Send a success response
        res.status(201).json({
          message: "User registered successfully",
          // userId: result.insertedId,
        });
      }
    } catch (error) {
      // Handle errors during signup
      res.status(500).json({
        message: "Error registering user",
        error: JSON.stringify(error),
      });
    }
  });

  app.post("/addToken", keycloak.protect(), async (req, res) => {
    const { tokenName, created, expire, uuid } = req.body;
    try {
      const token = createToken();
      const result_token = await db
        .collection("token_base")
        .insertOne({ ...req.body, last_used: null, token });
      delete req.body.uuid;
      const result = await db.collection("users").updateOne(
        { uuid }, // Filter to find the document by uuid
        {
          $push: {
            tokens: { ...req.body, _id: result_token.insertedId }, // Push the new object to the tokens array
          },
        } // Create the document if it doesn't exist
      );
      res.status(201).json({
        message: "Token successfully added",
        token,
        _id: result_token.insertedId,
      });
    } catch (error) {
      // Handle errors during signup
      res.status(500).json({
        message: "Error adding Token",
        error: JSON.stringify(error),
      });
    }
  });

  app.post("/deleteToken", keycloak.protect(), async (req, res) => {
    const { _id, uuid } = req.body;
    try {
      await db
        .collection("token_base")
        .deleteOne({ _id: ObjectId.createFromHexString(_id) });
      await db.collection("users").updateOne(
        { uuid }, // The filter for the document
        {
          $pull: {
            tokens: { _id: ObjectId.createFromHexString(_id) }, // Remove the specific token from the tokens array
          },
        }
      );
      res.status(203).json({
        message: "Token successfully deleted",
      });
    } catch (error) {
      // Handle errors during signup
      res.status(500).json({
        message: "Error deleting Token",
        error: JSON.stringify(error),
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

const generateToken = async () => {
  clearTimeout(acc_timeout);
  clearTimeout(refresh_timeout);
  try {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    // Make a request to Keycloak's token endpoint
    const response = await axios.post(
      "https://us1-dev.fohik.com/auth/realms/master/protocol/openid-connect/token",
      {
        client_id: "admin-cli",
        grant_type: "password",
        username: "admin",
        password: "admin",
      },
      { headers }
    );
    token = response.data;
    setToken(token.access_token);
    acc_timeout = setTimeout(() => {
      acc_timeout = null;
      refresh_timeout = setTimeout(() => {
        refresh_timeout = null;
      }, 59940000);
    }, 60000);
  } catch (_er) {
    console.log(_er);
  }
};

const refreshAuth = () => {
  clearTimeout(acc_timeout);
  clearTimeout(refresh_timeout);
  acc_timeout = setTimeout(() => {
    acc_timeout = null;
    refresh_timeout = setTimeout(() => {
      refresh_timeout = null;
    }, 59940000);
  }, 60000);
};

const verifyKey = async (key) => {
  const result = await db.collection("token_base").findOneAndUpdate(
    { token: key }, // Filter to find the document by _id
    {
      $set: { last_used: new Date().getTime() }, // Update the 'lastUsed' field
    },
    { upsert: false } // Don't insert a new document, just update the existing one
  );
  await db.collection("users").updateOne(
    {
      uuid: result?.uuid,
      "tokens._id": result?._id,
    }, // Filter to find the document by uuid
    { $set: { "tokens.$.last_used": new Date().getTime() } } // Update the 'lastUsed' field of the matched array object
  );
  // console.log(result?.expire > new Date().getTime(), res);
  return result?.expire > new Date().getTime();
};

module.exports = { startAppServer, verifyKey };
