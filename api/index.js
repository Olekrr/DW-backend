const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const membersRoutes = require('./routes/members');
const raidGroupsRoutes = require('./routes/raidGroups');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
app.use('/members', membersRoutes);
app.use('/raid-groups', raidGroupsRoutes);

// Home route
app.get('/', (req, res) => {
  res.send('Welcome to the Guild Backend!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
