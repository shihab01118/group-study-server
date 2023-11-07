const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jcpqyde.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

const database = client.db("groupStudyDB");
const assignmentCollection = database.collection("assignments");
const submittedCollection = database.collection("submittedAssignments");

// assignments related api's
app.get("/api/v1/user/assignments", async (req, res) => {
  try {
    const difficultyLevel = req.query.difficulty;
    let query;
    if (difficultyLevel === "All") {
      query = {};
    } else {
      query = { level: difficultyLevel };
    }
    const result = await assignmentCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
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
app.get("/api/v1/user/submitted_assignments", async (req, res) => {
  const assignmentStatus = req.query.status;
  const query = { status: assignmentStatus };
  const result = await submittedCollection.find(query).toArray();
  res.send(result);
});

app.get("/api/v1/user/submitted_assignments/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: new ObjectId(id)};
    const result = await submittedCollection.findOne(query);
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
});
app.get("/api/v1/user/user_submitted_assignments/:email", async (req, res) => {
  try {
    const userEmail = req.params.email;
    const query = { examineeEmail: userEmail};
    const result = await submittedCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    res.send(error.message);
  }
});

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
    const filter = { _id: new ObjectId(id)};
    const checkedAssignment = req.body;
    const updateDoc = {
      $set: {
        status: checkedAssignment.status,
        remark: checkedAssignment.remark,
        feedback: checkedAssignment.feedback
      },
    };
    const result = await submittedCollection.updateOne(filter, updateDoc);
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
