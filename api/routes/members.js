const express = require('express');
const { ObjectId } = require('mongodb');
const connectToMongoDB = require('../utils/mongoClient');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

// Get all members
router.get('/', async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const membersCollection = db.collection('members');
    const members = await membersCollection.find().toArray();
    res.json(members);
  } catch (error) {
    console.error('Error fetching members:', error.message);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
});

// Add a new member
router.post('/', authenticate, async (req, res) => {
  const { characterName, class: memberClass, raidAssignment = null, role = null } = req.body;

  if (!characterName || !memberClass) {
    return res.status(400).json({ message: 'Character name and class are required' });
  }

  try {
    const db = await connectToMongoDB();
    const membersCollection = db.collection('members');
    const newMember = { characterName, class: memberClass, raidAssignment, role };
    const result = await membersCollection.insertOne(newMember);
    res.status(201).json({ _id: result.insertedId, ...newMember });
  } catch (error) {
    console.error('Error adding member:', error.message);
    res.status(500).json({ message: 'Failed to add member' });
  }
});

module.exports = router;
