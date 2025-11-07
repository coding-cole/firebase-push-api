const admin = require("./firebase");
const express = require('express');
const bodyParser = require('body-parser');
const { generateNameFromUsername,generateAccountNumber } = require('./helpers')
const app = express();
app.use(bodyParser.json());

const db = admin.firestore();
const tokensCollection = db.collection('fcmTokens');

// Register/update FCM token
app.post('/register-token', async (req, res) => {
    const { deviceId, token, deviceInfo = {} } = req.body;

    if (!deviceId || !token) {
        return res.status(400).json({ 
            error: 'deviceId and token are required' 
        });
    }

    try {
        const docRef = tokensCollection.doc(deviceId.toString());
        const doc = await docRef.get();

        if (doc.exists) {
            // Device exists, update it
            await docRef.update({
                token: token,
                deviceInfo: deviceInfo,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`Token updated for existing device ${deviceId}`);
            res.status(200).json({ 
                message: 'Token updated successfully',
                deviceId: deviceId,
                isNew: false
            });
        } else {
            // Device doesn't exist, create new document
            await docRef.set({
                token: token,
                deviceId: deviceId,
                deviceInfo: deviceInfo,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`New token registered for device ${deviceId}`);
            res.status(201).json({ 
                message: 'Token registered successfully',
                deviceId: deviceId,
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
    const { deviceId } = req.body;

    if (!deviceId) {
        return res.status(400).json({ error: 'deviceId is required' });
    }

    try {
        const doc = await tokensCollection.doc(deviceId.toString()).get();
        
        if (!doc.exists) {
            return res.status(404).json({error: 'Token not found for this device'});
        }

        res.status(200).json(doc.data());
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).json({error: 'Error fetching token'});
    }
});

// Get list of all registered devices
app.get('/get-devices', async (req, res) => {
    try {
        const snapshot = await tokensCollection.get();
        
        if (snapshot.empty) {
            return res.status(200).json({
                message: 'No devices registered',
                devices: [],
                count: 0
            });
        }

        const devices = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                deviceId: data.deviceId,
                token: data.token,
                deviceInfo: data.deviceInfo || {},
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
            };
        });

        res.status(200).json({
            message: 'Devices retrieved successfully',
            devices: devices,
            count: devices.length
        });
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({error: 'Error fetching devices'});
    }
});

// Delete token
app.delete('/delete-token', async (req, res) => {
    const { deviceId } = req.body;

    if (!deviceId) {
        return res.status(400).json({error: 'deviceId is required'});
    }
    
    try {
        await tokensCollection.doc(deviceId.toString()).delete();
        res.status(200).json({error: 'Token deleted successfully'});
    } catch (error) {
        console.error('Error deleting token:', error);
        res.status(500).json({error: 'Error deleting token'});
    }
});

// Send notification by deviceId
app.post('/send-notification', async (req, res) => {
    const { deviceId, title, body, data = {} } = req.body;

    if (!deviceId || !title || !body) {
        return res.status(400).json({error: 'deviceId, title, and body are required'});
    }

    try {
        const doc = await tokensCollection.doc(deviceId.toString()).get();
        
        if (!doc.exists) {
            return res.status(404).json({error: 'Token not found for this device'});
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

        const response = await admin.messaging().json({message});
        console.log('Successfully sent message:', response);
        res.status(200).json({error: 'Notification sent successfully'});
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({error: 'Error sending notification'});
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