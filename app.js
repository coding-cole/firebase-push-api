const admin = require("./firebase");
const express = require('express');
const bodyParser = require('body-parser');
const { generateNameFromUsername, generateAccountNumber } = require('./helpers')
const app = express();
app.use(bodyParser.json());

const db = admin.firestore();
const tokensCollection = db.collection('fcmTokens');

// Register/update FCM token
app.post('/register-token', async (req, res) => {
    const { accountNumber, token = {} } = req.body;

    if (!accountNumber || !token) {
        return res.status(400).json({
            error: 'accountNumber and token are required'
        });
    }

    try {
        const docRef = tokensCollection.doc(accountNumber.toString());
        const doc = await docRef.get();

        if (doc.exists) {
            // Device exists, update it
            await docRef.update({
                token: token,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Token updated for existing account ${accountNumber}`);
            res.status(200).json({
                message: 'Token updated successfully',
                accountNumber: accountNumber,
                isNew: false
            });
        } else {
            // Device doesn't exist, create new document
            await docRef.set({
                accountNumber: accountNumber,
                token: token,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`New token registered for device ${accountNumber}`);
            res.status(201).json({
                message: 'Token registered successfully',
                accountNumber: accountNumber,
                isNew: true
            });
        }
    } catch (error) {
        console.error('Error registering token:', error);
        res.status(500).json({
            error: 'Error registering token'
        });
    }
});

// Get token for a specific device
app.post('/get-token', async (req, res) => {
    const { accountNumber } = req.body;

    if (!accountNumber) {
        return res.status(400).json({ error: 'accountNumber is required' });
    }

    try {
        const doc = await tokensCollection.doc(accountNumber.toString()).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Token not found for this accountNumber' });
        }

        res.status(200).json(doc.data());
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).json({ error: 'Error fetching token' });
    }
});

// Delete token
app.delete('/delete-token', async (req, res) => {
    const { accountNumber } = req.body;

    if (!accountNumber) {
        return res.status(400).json({ error: 'accountNumber is required' });
    }

    try {
        await tokensCollection.doc(accountNumber.toString()).delete();
        res.status(200).json({ error: 'Token deleted successfully' });
    } catch (error) {
        console.error('Error deleting token:', error);
        res.status(500).json({ error: 'Error deleting token' });
    }
});

// Send notification by deviceId
app.post('/send-notification', async (req, res) => {
    const { accountNumber, title, body, data = {} } = req.body;

    if (!accountNumber || !title || !body) {
        return res.status(400).json({ error: 'accountNumber, title, and body are required' });
    }

    try {
        const doc = await tokensCollection.doc(accountNumber.toString()).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Token not found for this accountNumber' });
        }

        const { token } = doc.data();

        const message = {
            token: token,
            notification: {
                title: title,
                body: body,
            },
            data: data,
            android: {
                priority: 'high',
                notification: {
                    channelId: 'default',
                    sound: 'default',
                },
            },
            apns: {
                headers: {
                    'apns-priority': '10',
                },
                payload: {
                    aps: {
                        sound: 'default',
                    },
                },
            },
        };

        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        res.status(200).json({ error: 'Notification sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error sending notification' });
    }
});

// Generate Account endpoint
app.post('/generate-account', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({
            error: 'username is required'
        });
    }

    try {
        const accountName = generateNameFromUsername(username);
        const accountNumber = generateAccountNumber(username);

        res.status(200).json({
            accountName: accountName,
            accountNumber: accountNumber,
        });

    } catch (error) {
        console.error('Error generating account:', error);
        res.status(500).json({
            error: 'Error generating account details'
        });
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});