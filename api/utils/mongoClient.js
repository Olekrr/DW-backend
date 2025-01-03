const { MongoClient } = require('mongodb');

require('dotenv').config();

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri);

let db;

const connectToMongoDB = async () => {
  try {
    if (!db) {
      await client.connect();
      db = client.db('dw-data');
      console.log('Successfully connected to MongoDB!');
    }
    return db;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
};

module.exports = connectToMongoDB;
