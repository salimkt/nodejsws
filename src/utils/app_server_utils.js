const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const axios = require("axios");

const app = express();
// configure port of app server
const PORT = 3000;
app.use(bodyParser.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const { auth_url } = require("./configs");
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

// Step 1: Generate Diffie-Hellman keys on the server
const serverDH = crypto.createDiffieHellman(2048);
const serverPublicKey = serverDH.generateKeys();
// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log(
//       "Pinged your deployment. You successfully connected to MongoDB!"
//     );
//   } finally {
//     // Ensures that the client will close when you finish/error
//     await client.close();
//   }
// }
// run().catch(console.dir);

const startAppServer = () => {
  app.post("/key_exchange", async (req, res) => {
    const { username, p_key } = req.body;
    const serverSharedSecret = serverDH.computeSecret(p_key);
    console.log(serverSharedSecret.toString("hex"));
    res.json({ server_p_key: serverPublicKey.toString("hex") });
  });
  // POST endpoint to handle login
  app.post("/signin", async (req, res) => {
    const { username, password } = req.body;
    console.log(req.body);
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    try {
      // Make a request to Keycloak's token endpoint
      const response = await axios.post(
        "https://us1-dev.fohik.com/auth/realms/" +
          "debugtrail" +
          "/protocol/openid-connect/token",
        {
          client_id: "debugtrail",
          grant_type: "password",
          username: username,
          password: password,
        },
        { headers }
      );

      //   // Send back the access and refresh tokens
      res.json(response.data);
    } catch (error) {
      res.status(error.response.status).json({
        // data: error.response,
        error: "Invalid credentials",
      });
    }
  });

  app.post("/signup", async (req, res) => {
    const { username, password, email } = req.body;

    try {
      // Check if the user already exists
      const existingUser = await db.collection("users").findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }

      // Create a new user object
      //   const newUser = {
      //     username: username,
      //     password: password, // In a real app, hash the password before saving
      //     email: email,
      //   };

      // Insert the user into the database
      const result = await db.collection("users").insertOne(req.body);

      // Send a success response
      res.status(201).json({
        message: "User registered successfully",
        userId: result.insertedId,
      });
    } catch (error) {
      // Handle errors during signup
      res.status(500).json({
        message: "Error registering user",
        error: error.message,
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

module.exports = { startAppServer };