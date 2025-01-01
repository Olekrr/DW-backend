const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const SECRET_KEY = process.env.SECRET_KEY || 'fallback_secret_key';

// Middleware
app.use(cors({
  origin: '*', // Replace '*' with specific domains in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json());

// Path to the data file
const raidDataPath = path.join(process.cwd(), 'data', 'raidData.json');

// Admin credentials
const admin = {
  username: process.env.ADMIN_USERNAME,
  passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
};

// Utility functions to read and write raid data
const readRaidData = () => {
  try {
    if (!fs.existsSync(raidDataPath)) {
      console.warn('raidData.json not found. Creating a new file.');
      writeRaidData({ members: [] });
    }
    return JSON.parse(fs.readFileSync(raidDataPath, 'utf-8'));
  } catch (error) {
    console.error('Error reading raidData.json:', error.message);
    return { members: [] }; // Return a default structure to avoid crashes
  }
};

const writeRaidData = (data) => {
  try {
    fs.writeFileSync(raidDataPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing to raidData.json:', error.message);
  }
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
app.get('/members', (req, res) => {
  try {
    const data = readRaidData();
    res.json(data.members);
  } catch (error) {
    console.error('Error fetching member data:', error.message);
    res.status(500).json({ message: 'Failed to fetch member data' });
  }
});

// Add a new member (admin only)
app.post('/members', authenticate, (req, res) => {
  const { characterName, class: memberClass, raidAssignment = null, role = null } = req.body;

  if (!characterName || !memberClass) {
    console.log('Validation failed:', req.body);
    return res.status(400).json({ message: 'Character name and class are required' });
  }

  try {
    const data = readRaidData();
    const newMember = {
      id: data.members.length + 1, // Generate a new ID
      characterName,
      class: memberClass,
      raidAssignment,
      role,
    };

    data.members.push(newMember);
    writeRaidData(data);
    console.log('Member added successfully:', newMember);
    res.status(201).json(newMember);
  } catch (error) {
    console.error('Error adding member:', error.message);
    res.status(500).json({ message: 'Failed to add member' });
  }
});

// Update a member (admin only)
app.put('/members/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { characterName, class: memberClass, raidAssignment, role } = req.body;

  try {
    const data = readRaidData();
    const memberIndex = data.members.findIndex((member) => member.id === parseInt(id));

    if (memberIndex === -1) {
      console.log('Member not found:', id);
      return res.status(404).json({ message: 'Member not found' });
    }

    const updatedMember = {
      ...data.members[memberIndex],
      characterName: characterName || data.members[memberIndex].characterName,
      class: memberClass || data.members[memberIndex].class,
      raidAssignment: raidAssignment || data.members[memberIndex].raidAssignment,
      role: role || data.members[memberIndex].role,
    };

    data.members[memberIndex] = updatedMember;
    writeRaidData(data);
    console.log('Member updated successfully:', updatedMember);
    res.status(200).json(updatedMember);
  } catch (error) {
    console.error('Error updating member:', error.message);
    res.status(500).json({ message: 'Failed to update member' });
  }
});

// Delete a member (admin only)
app.delete('/members/:id', authenticate, (req, res) => {
  const { id } = req.params;

  try {
    const data = readRaidData();
    const updatedMembers = data.members.filter((member) => member.id !== parseInt(id));

    if (updatedMembers.length === data.members.length) {
      console.log('Member not found:', id);
      return res.status(404).json({ message: 'Member not found' });
    }

    data.members = updatedMembers;
    writeRaidData(data);
    console.log('Member deleted successfully:', id);
    res.status(200).json({ message: 'Member deleted' });
  } catch (error) {
    console.error('Error deleting member:', error.message);
    res.status(500).json({ message: 'Failed to delete member' });
  }
});

// Export the app for serverless function usage
module.exports = app;
