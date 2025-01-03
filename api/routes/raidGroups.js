const express = require('express');
const { ObjectId } = require('mongodb');
const connectToMongoDB = require('../utils/mongoClient');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

// Get all raid groups
router.get('/', authenticate, async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const raidGroupsCollection = db.collection('raidgroup');
    const raidGroups = await raidGroupsCollection.find().toArray();
    res.json(raidGroups);
  } catch (error) {
    console.error('Error fetching raid groups:', error.message);
    res.status(500).json({ message: 'Failed to fetch raid groups' });
  }
});

// Add a new raid group
router.post('/', authenticate, async (req, res) => {
  const newRaidGroup = req.body;

  try {
    const db = await connectToMongoDB();
    const raidGroupsCollection = db.collection('raidgroup');
    const result = await raidGroupsCollection.insertOne(newRaidGroup);
    res.status(201).json({ _id: result.insertedId, ...newRaidGroup });
  } catch (error) {
    console.error('Error creating raid group:', error.message);
    res.status(500).json({ message: 'Failed to create raid group' });
  }
});

module.exports = router;
