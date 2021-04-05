const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
var admin = require("firebase-admin");
const MongoClient = require("mongodb").MongoClient;
require('dotenv').config()

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.g5ktv.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

var serviceAccount = require("./configs/burj-al-arab-8407d-firebase-adminsdk-j7tuu-ccf71705cc.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const port = 5000;

const app = express();
app.use(cors());
app.use(bodyParser.json());


const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("burjAlArab").collection("bookings");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];
      admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            bookings
              .find({ email: queryEmail})
              .toArray((err, document) => {
                res.status(200).send(document);
              });
          }
        })
        .catch((error) => {
          res.status(401).send('un-authorized access');
        });
    }
    else{
      res.status(401).send('un-authorized access');
    }
  });
});

app.listen(port);
