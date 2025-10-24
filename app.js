const admin = require("./firebase");
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.post('/send-notification', async (req, res) => {
    const { token, title, body, data = {} } = req.body;

    if (!token || !title || !body) {
        return res.status(400).send('Token, title, and body are required');
    }

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

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        res.status(200).send('Notification sent successfully');
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).send('Error sending notification');
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});