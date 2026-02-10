const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Create generated-diaries directory if it doesn't exist
const generatedDir = path.join(__dirname, 'generated-diaries');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir);
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
app.use('/generated-diaries', express.static(generatedDir));

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

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `diary-${timestamp}.html`;
        const filepath = path.join(generatedDir, filename);

        // Save the generated HTML
        fs.writeFileSync(filepath, template);

        // Return the URL
        res.json({
            success: true,
            url: `/generated-diaries/${filename}`,
            filename: filename
        });

    } catch (error) {
        console.error('Error generating diary:', error);
        res.status(500).json({ error: 'Failed to generate diary' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📖 Create your couple diary at http://localhost:${PORT}`);
});
