const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

console.log("--- SERVER RUNNING LATEST CODE (v4-stream-now-test) ---");

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 10000;

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
    // MODIFIED: Title and description are now hardcoded for this test
    const { title = "API Stream Now Test", description = "Testing a non-scheduled stream." } = req.body;

    try {
        console.log("Attempting to create a 'Stream Now' broadcast...");

        const response = await youtube.liveBroadcasts.insert({
            part: ['id', 'snippet', 'contentDetails', 'status'],
            requestBody: {
                snippet: {
                    title,
                    description,
                    // MODIFIED: scheduledStartTime has been removed to create a "stream now" event
                },
                contentDetails: {
                    enableAutoStart: true,
                    enableAutoStop: true,
                    monitorStream: {
                        enableMonitorStream: false,
                    },
                },
                status: {
                    privacyStatus: 'private', // Testing with private
                    selfDeclaredMadeForKids: false,
                },
            },
        });

        const liveVideoId = response.data.id;
        console.log("Successfully created broadcast with ID:", liveVideoId);
        res.status(200).json({ liveVideoId });

    } catch (err) {
        console.error('YouTube API Error (Stream Now Test):', err);
        // Return the actual error from YouTube for better diagnostics
        res.status(err.code || 500).json({ 
            error: 'An error occurred during the stream now test.',
            youtube_error: err.errors || err.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
