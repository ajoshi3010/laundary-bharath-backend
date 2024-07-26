const express = require("express");
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();
const serviceAccount = JSON.parse(process.env.GOOGLE_CREDENTIALS);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  const db = admin.firestore();
const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get("/", (req, res) => res.send("Express on Vercel"));

// Add new contact and mark clothes as in work
app.post('/addContact', async (req, res) => {
    const { name, phone } = req.body;
    try {
      const existingContactQuery = await db.collection('inWork')
        .where('name', '==', name)
        .where('phone', '==', phone)
        .get();
  
      if (!existingContactQuery.empty) {
        return res.json({ success: false, error: 'Contact already exists.' });
      }
  
      await db.collection('inWork').add({ name, phone });
      res.json({ success: true });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  });
  
  // Mark clothes as ready for delivery
  app.post('/markReady', async (req, res) => {
    const { id, name, phone } = req.body;
    try {
      await db.collection('inWork').doc(id).delete();
      await db.collection('readyForDelivery').add({ name, phone });
  
      res.json({ success: true });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  });
  
  // Mark clothes as delivered
  app.post('/markDelivered', async (req, res) => {
    const { id, name, phone } = req.body;
    try {
      await db.collection('readyForDelivery').doc(id).delete();
      await db.collection('history').add({ name, phone, status: 'delivered', timestamp: new Date() });
  
      res.json({ success: true });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  });
  
  // Get current status
  app.get('/status', async (req, res) => {
    try {
      const inWork = await db.collection('inWork').get();
      const readyForDelivery = await db.collection('readyForDelivery').get();
      const history = await db.collection('history').get();
  
      const inWorkData = inWork.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const readyForDeliveryData = readyForDelivery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const historyData = history.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
      res.json({ inWork: inWorkData, readyForDelivery: readyForDeliveryData, history: historyData });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  });
  
  // Fetch contacts whose status is 'inWork'
  app.get('/contacts/inWork', async (req, res) => {
    try {
      const inWork = await db.collection('inWork').get();
      const inWorkData = inWork.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
      res.json({ success: true, inWork: inWorkData });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  });
  // Fetch contacts ready for delivery
  app.get('/contacts/readyForDelivery', async (req, res) => {
    try {
      const readyForDelivery = await db.collection('readyForDelivery').get();
  
      const readyForDeliveryData = readyForDelivery.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
  
      res.json({ success: true, readyForDelivery: readyForDeliveryData });
    } catch (error) {
      res.json({ success: false, error: error.message });
    }
  });

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;