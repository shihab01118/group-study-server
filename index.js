const express = require("express");
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// parsers
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://study-group-83e71.web.app",
      "https://study-group-83e71.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jcpqyde.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middlewares
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unAuthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unAuthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const database = client.db("groupStudyDB");
const assignmentCollection = database.collection("assignments");
const submittedCollection = database.collection("submittedAssignments");
const featuredCollection = database.collection("featured");
const faqCollection = database.collection("FAQs");

// assignments related api's
app.get("/api/v1/user/assignments", async (req, res) => {
  try {
    const difficultyLevel = req.query.difficulty;
    // console.log("pagination query: ", req.query);
    const page = parseInt(req.query.page);
    const size = parseInt(req.query.size);

    if (difficultyLevel === "All") {
      const result = await assignmentCollection
        .find()
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    } else {
      const query = { level: difficultyLevel };
      const result = await assignmentCollection.find(query).toArray();
      res.send(result);
    }
  } catch (error) {
    res.send(error.message);
  }
});

app.get("/api/v1/user/assignmentsCount", async (req, res) => {
  const count = await assignmentCollection.estimatedDocumentCount();
  res.send({ count });
});

app.get("/api/v1/user/assignments/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await assignmentCollection.findOne(query);
    res.send(result);
  } catch (error) {
    res.send(error);
  }
});

app.post("/api/v1/user/assignments", async (req, res) => {
  try {
    const assignment = req.body;
    const result = await assignmentCollection.insertOne(assignment);
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
});

app.put("/api/v1/user/assignments/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const body = req.body;
    const updatedAssignment = {
      $set: {
        ...body,
      },
    };
    const options = { upsert: true };
    const result = await assignmentCollection.updateOne(
      filter,
      updatedAssignment,
      options
    );
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
});

app.delete("/api/v1/user/assignments/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await assignmentCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
});

// submitted assignments related api's
app.get("/api/v1/user/submitted_assignments", verifyToken, async (req, res) => {
  const assignmentStatus = req.query.status;

  if (req.user.email !== req.query.email) {
    return res.status(403).send({ message: "forbidden user" });
  }

  const query = { status: assignmentStatus };
  const result = await submittedCollection.find(query).toArray();
  res.send(result);
});

app.get("/api/v1/user/submitted_assignments/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await submittedCollection.findOne(query);
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
});

app.get(
  "/api/v1/user/user_submitted_assignments/:email",
  verifyToken,
  async (req, res) => {
    try {
      const userEmail = req.params.email;

      if (req.user.email !== userEmail) {
        return res.status(403).send({ message: "forbidden user" });
      }

      const query = { examineeEmail: userEmail };
      const result = await submittedCollection.find(query).toArray();
      res.send(result);
    } catch (error) {
      res.send(error.message);
    }
  }
);

app.post("/api/v1/user/submitted_assignments", async (req, res) => {
  try {
    const submittedAssignment = req.body;
    // res.send(submittedAssignment)
    const result = await submittedCollection.insertOne(submittedAssignment);
    res.send(result);
  } catch (error) {
    res.send(error);
  }
});

app.put("/api/v1/user/submitted_assignments/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const checkedAssignment = req.body;
    const updateDoc = {
      $set: {
        status: checkedAssignment.status,
        remark: checkedAssignment.remark,
        feedback: checkedAssignment.feedback,
      },
    };
    const result = await submittedCollection.updateOne(filter, updateDoc);
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
});

// auth related api's
app.post("/api/v1/auth/jwt", async (req, res) => {
  try {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "10h",
    });
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      })
      .send({ success: true });
  } catch (error) {
    res.send(error.message);
  }
});

app.post("/api/v1/auth/logout", async (req, res) => {
  const user = req.body;
  res
    .clearCookie("token", {
      httpOnly: true,
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    })
    .send({ success: true });
});

// featured related api's
app.get("/api/v1/user/featured", async (req, res) => {
  try {
    const result = await featuredCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
});

// faq related api's
app.get("/api/v1/user/FAQs", async (req, res) => {
  try {
    const result = await faqCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
});

app.get("/", (req, res) => {
  res.send("valo kore study koro");
});

app.listen(port, () => {
  console.log(`group study is running on port: ${port}`);
});
