const { MongoClient, ServerApiVersion } = require('mongodb');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Load connection string from environment or use the provided one
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://cluster0.2oexg.mongodb.net/?authSource=%24external&authMechanism=MONGODB-X509&retryWrites=true&w=majority&appName=Cluster0';

// Get the certificate path
const CERT_PATH = process.env.MONGODB_CERT_PATH || path.resolve(__dirname, '../certs/X509-cert-MongoDBAtlas-Dev.pem');

async function testConnection() {
  console.log('Testing MongoDB Atlas connection with X.509 authentication...');
  console.log('Certificate path:', CERT_PATH);
  console.log('Connection string:', MONGODB_URI);
  
  // Check if certificate file exists
  if (!fs.existsSync(CERT_PATH)) {
    console.error(`Certificate file not found at: ${CERT_PATH}`);
    return;
  }
  
  console.log('Certificate file found, checking file size...');
  const stats = fs.statSync(CERT_PATH);
  console.log(`Certificate file size: ${stats.size} bytes`);
  
  if (stats.size === 0) {
    console.error('Certificate file is empty!');
    return;
  }
  
  try {
    console.log('Creating MongoDB client with X.509 authentication...');
    const client = new MongoClient(MONGODB_URI, {
      tlsCertificateKeyFile: CERT_PATH,
      serverApi: ServerApiVersion.v1
    });

    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('Successfully connected to MongoDB Atlas!');
    
    // List databases to verify connection
    console.log('Listing databases...');
    const adminDb = client.db('admin');
    const result = await adminDb.command({ listDatabases: 1 });
    
    console.log('Available databases:');
    result.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });
    
    await client.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error connecting to MongoDB Atlas:', error);
  }
}

testConnection().catch(console.error); 