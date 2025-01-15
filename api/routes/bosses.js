const express = require('express');
const { ObjectId } = require('mongodb');
const connectToMongoDB = require('../utils/mongoClient');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

// Get all bosses
router.get('/', async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const bossesCollection = db.collection('bosses');
    const bosses = await bossesCollection.find().toArray();
    res.json(bosses);
  } catch (error) {
    console.error('Error fetching bosses:', error.message);
    res.status(500).json({ message: 'Failed to fetch bosses' });
  }
});

// Get a specific boss by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const db = await connectToMongoDB();
    const bossesCollection = db.collection('bosses');
    const boss = await bossesCollection.findOne({ _id: new ObjectId(id) });

    if (!boss) {
      return res.status(404).json({ message: 'Boss not found' });
    }

    res.json(boss);
  } catch (error) {
    console.error(`Error fetching boss with ID ${id}:`, error.message);
    res.status(500).json({ message: 'Failed to fetch boss' });
  }
});

// Get a specific boss by name
router.get('/name/:name', async (req, res) => {
  const { name } = req.params;

  try {
    const db = await connectToMongoDB();
    const bossesCollection = db.collection('bosses');
    const boss = await bossesCollection.findOne({ name });

    if (!boss) {
      return res.status(404).json({ message: 'Boss not found' });
    }

    res.json(boss);
  } catch (error) {
    console.error(`Error fetching boss with name ${name}:`, error.message);
    res.status(500).json({ message: 'Failed to fetch boss by name' });
  }
});

// Update roles for a specific boss
router.put('/:id/roles', authenticate, async (req, res) => {
  const { id } = req.params;
  const { roles } = req.body;

  if (!roles || typeof roles !== 'object') {
    return res.status(400).json({ message: 'Roles must be a valid object' });
  }

  try {
    const db = await connectToMongoDB();
    const bossesCollection = db.collection('bosses');
    const result = await bossesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { roles } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Boss not found' });
    }

    res.json({ message: 'Boss roles updated successfully' });
  } catch (error) {
    console.error(`Error updating roles for boss with ID ${id}:`, error.message);
    res.status(500).json({ message: 'Failed to update boss roles' });
  }
});

module.exports = router;
