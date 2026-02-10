const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Use /tmp for generated-diaries in serverless
const generatedDir = path.join('/tmp', 'generated-diaries');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Serve static files
app.use(express.static(__dirname));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Generate diary endpoint
app.post('/generate', upload.array('images', 10), async (req, res) => {
    try {
        const { partner1, partner2 } = req.body;
        const files = req.files;

        if (!files || files.length < 2) {
            return res.status(400).json({ error: 'At least 2 images are required' });
        }

        // Convert images to base64 data URIs
        const imageUrls = files.map(file => {
            const base64 = file.buffer.toString('base64');
            const mimeType = file.mimetype;
            return `data:${mimeType};base64,${base64}`;
        });

        // Read the diary template
        const templatePath = path.join(__dirname, 'diary-template.html');
        let template = fs.readFileSync(templatePath, 'utf8');

        // Replace placeholders
        const imageUrlsString = JSON.stringify(imageUrls, null, 2);
        template = template.replace('{{IMAGE_URLS}}', imageUrlsString);
        template = template.replace(/{{PARTNER1}}/g, partner1 || 'Partner 1');
        template = template.replace(/{{PARTNER2}}/g, partner2 || 'Partner 2');

        // Create URL-friendly slug from couple names
        const name1 = (partner1 || 'partner1').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const name2 = (partner2 || 'partner2').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const coupleSlug = `${name1}-${name2}`;

        // Generate unique filename with timestamp to avoid collisions
        const timestamp = Date.now();
        const filename = `${coupleSlug}-${timestamp}.html`;
        const filepath = path.join(generatedDir, filename);

        // Save the generated HTML to /tmp
        fs.writeFileSync(filepath, template);

        // Create the shareable URL with couple names
        const diaryUrl = `/diary/${coupleSlug}-${timestamp}`;

        // Return the URL and filename to client
        res.json({
            success: true,
            url: diaryUrl,
            filename: filename,
            coupleNames: `${partner1} & ${partner2}`
        });

    } catch (error) {
        console.error('Error generating diary:', error);
        res.status(500).json({ error: 'Failed to generate diary' });
    }
});

// Serve individual diary pages at /diary/:slug
app.get('/diary/:slug', (req, res) => {
    const slug = req.params.slug;

    // Find the HTML file in /tmp
    const files = fs.existsSync(generatedDir) ? fs.readdirSync(generatedDir) : [];
    const matchingFile = files.find(f => f.includes(slug) || f.replace('.html', '') === slug);

    if (matchingFile) {
        const filepath = path.join(generatedDir, matchingFile);
        res.sendFile(filepath);
    } else {
        res.status(404).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Diary Not Found</title>
                <style>
                    body {
                        font-family: 'Cinzel', serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        margin: 0;
                        color: white;
                        text-align: center;
                    }
                    .error-box {
                        background: rgba(255,255,255,0.1);
                        backdrop-filter: blur(10px);
                        padding: 50px;
                        border-radius: 20px;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    }
                    h1 { font-size: 60px; margin: 0 0 20px 0; }
                    p { font-size: 20px; margin: 10px 0; }
                    a {
                        display: inline-block;
                        margin-top: 30px;
                        padding: 15px 40px;
                        background: white;
                        color: #667eea;
                        text-decoration: none;
                        border-radius: 50px;
                        font-weight: bold;
                        transition: transform 0.2s;
                    }
                    a:hover { transform: translateY(-3px); }
                </style>
            </head>
            <body>
                <div class="error-box">
                    <h1>📖 404</h1>
                    <p>Diary not found</p>
                    <p>This diary may have been removed or the link is incorrect.</p>
                    <a href="/">Create Your Own Diary</a>
                </div>
            </body>
            </html>
        `);
    }
});

// Alternative route: /generated-diaries/:filename (for direct access)
app.get('/generated-diaries/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(generatedDir, filename);

    if (fs.existsSync(filepath)) {
        res.sendFile(filepath);
    } else {
        res.status(404).send('Diary not found');
    }
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   💕 Couple Diary Generator                ║
║                                            ║
║   Server running at:                       ║
║   http://localhost:${PORT}                    ║
║                                            ║
║   Create your diary at:                    ║
║   http://localhost:${PORT}                    ║
╚═══════════════════════════════════��════════╝
    `);
});
