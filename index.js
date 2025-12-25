const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

console.log("--- SERVER RUNNING LATEST CODE (v2) ---"); // Diagnostic log

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// These will be stored as environment variables on the hosting platform
const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

app.post('/create-live-stream', async (req, res) => {
    const { title, description, scheduledStartTime } = req.body;

    if (!title || !description || !scheduledStartTime) {
        return res.status(400).json({ error: 'Missing required fields: title, description, scheduledStartTime' });
    }

    try {
        // A single, reliable API call to create the broadcast and stream
        const response = await youtube.liveBroadcasts.insert({
            part: ['id', 'snippet', 'contentDetails', 'status'],
            requestBody: {
                snippet: {
                    title,
                    description,
                    scheduledStartTime,
                },
                contentDetails: {
                    enableAutoStart: true,
                    enableAutoStop: true,
                    monitorStream: {
                        enableMonitorStream: false,
                    },
                },
                status: {
                    privacyStatus: 'unlisted', // Or 'public' or 'private'
                    selfDeclaredMadeForKids: false,
                },
            },
        });

        const liveVideoId = response.data.id;
        if (!liveVideoId) {
            throw new Error('Failed to get broadcast ID from YouTube.');
        }

        res.status(200).json({ liveVideoId });

    } catch (err) {
        console.error('YouTube API Error:', err);
        res.status(500).json({ error: 'An error occurred while creating the YouTube live stream.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
