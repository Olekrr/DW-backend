const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const connectToMongoDB = require('./mongoClient');

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || 'fallback_secret_key';

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(bodyParser.json());

// Admin credentials
const admin = {
  username: process.env.ADMIN_USERNAME,
  passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
};

// Routes

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to the Guild Backend!');
});

// Admin login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === admin.username && bcrypt.compareSync(password, admin.passwordHash)) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(403).json({ message: 'Access denied: Token missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, SECRET_KEY);
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

// Get all members (public access)
app.get('/members', async (req, res) => {
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

// Add a new member (admin only)
app.post('/members', authenticate, async (req, res) => {
  const { characterName, class: memberClass, raidAssignment = null, role = null } = req.body;

  if (!characterName || !memberClass) {
    return res.status(400).json({ message: 'Character name and class are required' });
  }

  try {
    const db = await connectToMongoDB();
    const membersCollection = db.collection('members');
    const newMember = {
      characterName,
      class: memberClass,
      raidAssignment,
      role,
    };

    const result = await membersCollection.insertOne(newMember);
    res.status(201).json(result.ops[0]); // Return the inserted document
  } catch (error) {
    console.error('Error adding member:', error.message);
    res.status(500).json({ message: 'Failed to add member' });
  }
});

// Update a member (admin only)
app.put('/members/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { characterName, class: memberClass, raidAssignment, role } = req.body;

  try {
    const db = await connectToMongoDB();
    const membersCollection = db.collection('members');
    const updatedMember = {
      ...(characterName && { characterName }),
      ...(memberClass && { class: memberClass }),
      ...(raidAssignment && { raidAssignment }),
      ...(role && { role }),
    };

    const result = await membersCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updatedMember },
      { returnOriginal: false }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json(result.value);
  } catch (error) {
    console.error('Error updating member:', error.message);
    res.status(500).json({ message: 'Failed to update member' });
  }
});

// Delete a member (admin only)
app.delete('/members/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    const db = await connectToMongoDB();
    const membersCollection = db.collection('members');
    const result = await membersCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Member not found' });
    }

    res.json({ message: 'Member deleted' });
  } catch (error) {
    console.error('Error deleting member:', error.message);
    res.status(500).json({ message: 'Failed to delete member' });
  }
});

// Export the app for serverless function usage
module.exports = app;
