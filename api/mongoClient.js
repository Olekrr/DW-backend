const { MongoClient } = require('mongodb');

// Load environment variables
require('dotenv').config();

// Connection string from .env file
const uri = process.env.MONGO_URI;

// Create a new MongoDB client
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Function to establish and reuse a connection to the database
let db;

const connectToMongoDB = async () => {
  try {
    if (!db) {
      // Connect the client to MongoDB server
      await client.connect();
      db = client.db('dw-data'); // Replace 'dw-data' with your actual database name
      console.log('Successfully connected to MongoDB!');
    }
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

module.exports = connectToMongoDB;
