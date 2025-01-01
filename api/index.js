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

  console.log('Login attempt:', { username, password });
  if (username === admin.username && bcrypt.compareSync(password, admin.passwordHash)) {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    console.log('Token generated:', token);
    res.json({ token });
  } else {
    console.log('Invalid credentials:', { username, password });
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('Authorization header missing');
    return res.status(403).json({ message: 'Access denied: Token missing' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token received:', token);

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    console.log('Token decoded successfully:', decoded);
    next();
  } catch (error) {
    console.error('Invalid token:', error.message);
    res.status(403).json({ message: 'Invalid token' });
  }
};

// Get all members (public access)
app.get('/members', async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const members = await db.collection('members').find().toArray();
    res.json(members);
  } catch (error) {
    console.error('Error fetching member data:', error.message);
    res.status(500).json({ message: 'Failed to fetch member data' });
  }
});

// Add a new member (admin only)
app.post('/members', authenticate, async (req, res) => {
  const { characterName, class: memberClass, raidAssignment = null, role = null } = req.body;

  if (!characterName || !memberClass) {
    console.log('Validation failed:', req.body);
    return res.status(400).json({ message: 'Character name and class are required' });
  }

  try {
    const db = await connectToMongoDB();
    const newMember = {
      characterName,
      class: memberClass,
      raidAssignment,
      role,
    };

    const result = await db.collection('members').insertOne(newMember);
    console.log('Member added successfully:', result.ops[0]);
    res.status(201).json(result.ops[0]);
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
    const updateFields = {};
    if (characterName) updateFields.characterName = characterName;
    if (memberClass) updateFields.class = memberClass;
    if (raidAssignment !== undefined) updateFields.raidAssignment = raidAssignment;
    if (role) updateFields.role = role;

    const result = await db.collection('members').findOneAndUpdate(
      { _id: new require('mongodb').ObjectId(id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      console.log('Member not found:', id);
      return res.status(404).json({ message: 'Member not found' });
    }

    console.log('Member updated successfully:', result.value);
    res.status(200).json(result.value);
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
    const result = await db.collection('members').deleteOne({ _id: new require('mongodb').ObjectId(id) });

    if (result.deletedCount === 0) {
      console.log('Member not found:', id);
      return res.status(404).json({ message: 'Member not found' });
    }

    console.log('Member deleted successfully:', id);
    res.status(200).json({ message: 'Member deleted' });
  } catch (error) {
    console.error('Error deleting member:', error.message);
    res.status(500).json({ message: 'Failed to delete member' });
  }
});

// Export the app for serverless function usage
module.exports = app;
