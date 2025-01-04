const express = require("express");
const { ObjectId } = require("mongodb");
const connectToMongoDB = require("../utils/mongoClient");
const authenticate = require("../middlewares/authenticate");

const router = express.Router();

// Get all raid groups
router.get("/", authenticate, async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const raidGroupsCollection = db.collection("raidgroup");
    const raidGroups = await raidGroupsCollection.find().toArray();
    res.json(raidGroups);
  } catch (error) {
    console.error("Error fetching raid groups:", error.message);
    res.status(500).json({ message: "Failed to fetch raid groups" });
  }
});

// Get a specific raid group by ID
router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const db = await connectToMongoDB();
    const raidGroupsCollection = db.collection("raidgroup");
    const raidGroup = await raidGroupsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!raidGroup) {
      return res.status(404).json({ message: "Raid group not found" });
    }

    res.json(raidGroup);
  } catch (error) {
    console.error("Error fetching raid group:", error.message);
    res.status(500).json({ message: "Failed to fetch raid group" });
  }
});

// Update a specific raid group by ID
router.put("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const updatedRaidGroup = req.body;

  try {
    const db = await connectToMongoDB();
    const raidGroupsCollection = db.collection("raidgroup");
    const result = await raidGroupsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedRaidGroup }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Raid group not found" });
    }

    res.json({ message: "Raid group updated successfully" });
  } catch (error) {
    console.error("Error updating raid group:", error.message);
    res.status(500).json({ message: "Failed to update raid group" });
  }
});

// Add a new raid group
router.post("/", authenticate, async (req, res) => {
  const newRaidGroup = req.body;

  try {
    const db = await connectToMongoDB();
    const raidGroupsCollection = db.collection("raidgroup");
    const result = await raidGroupsCollection.insertOne(newRaidGroup);
    res.status(201).json({ _id: result.insertedId, ...newRaidGroup });
  } catch (error) {
    console.error("Error creating raid group:", error.message);
    res.status(500).json({ message: "Failed to create raid group" });
  }
});

module.exports = router;
