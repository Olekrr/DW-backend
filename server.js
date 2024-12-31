const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = process.env.SECRET_KEY || 'fallback_secret_key';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Path to the data file
const raidDataPath = path.join(__dirname, 'data', 'raidData.json');

// Admin credentials
const admin = {
  username: process.env.ADMIN_USERNAME,
  passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
};

// Utility functions to read and write raid data
const readRaidData = () => JSON.parse(fs.readFileSync(raidDataPath, 'utf-8'));
const writeRaidData = (data) => fs.writeFileSync(raidDataPath, JSON.stringify(data, null, 2));


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
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    jwt.verify(token, SECRET_KEY);
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
  }
};

// Get all members (public access)
app.get('/members', (req, res) => {
  try {
    const data = readRaidData();
    res.json(data.members);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch member data' });
  }
});

// Add a new member (admin only)
app.post('/members', authenticate, (req, res) => {
  const { characterName, class: memberClass, raidAssignment = null, role = null } = req.body;

  if (!characterName || !memberClass) {
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
    res.status(201).json(newMember);
  } catch (error) {
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

    res.status(200).json(updatedMember);
  } catch (error) {
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
      return res.status(404).json({ message: 'Member not found' });
    }

    data.members = updatedMembers;
    writeRaidData(data);

    res.status(200).json({ message: 'Member deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete member' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
