const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   MULTER CONFIG
========================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

/* =========================
   GITHUB CONFIG
========================= */
const GITHUB_API = 'https://api.github.com';
const REPO = process.env.GITHUB_REPO;
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const TOKEN = process.env.GITHUB_TOKEN;

if (!REPO || !TOKEN) {
  console.error('Missing GitHub environment variables');
  process.exit(1);
}

const headers = {
  Authorization: `token ${TOKEN}`,
  Accept: 'application/vnd.github.v3+json'
};

/* =========================
   HELPERS
========================= */
const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

function getNextAvailableSlug(baseSlug, db) {
  if (!db[baseSlug]) return baseSlug;

  let i = 1;
  while (db[`${baseSlug}-${i}`]) {
    i++;
  }
  return `${baseSlug}-${i}`;
}

async function getServerDB() {
  try {
    const res = await axios.get(
      `${GITHUB_API}/repos/${REPO}/contents/server.json`,
      { headers, params: { ref: BRANCH } }
    );

    return {
      sha: res.data.sha,
      data: JSON.parse(
        Buffer.from(res.data.content, 'base64').toString()
      )
    };
  } catch {
    return { sha: null, data: {} };
  }
}

async function saveServerDB(db, sha) {
  await axios.put(
    `${GITHUB_API}/repos/${REPO}/contents/server.json`,
    {
      message: 'Update diary database',
      content: Buffer.from(
        JSON.stringify(db, null, 2)
      ).toString('base64'),
      sha,
      branch: BRANCH
    },
    { headers }
  );
}

async function saveDiaryHTML(slug, html) {
  await axios.put(
    `${GITHUB_API}/repos/${REPO}/contents/diaries/${slug}.html`,
    {
      message: `Add diary ${slug}`,
      content: Buffer.from(html).toString('base64'),
      branch: BRANCH
    },
    { headers }
  );
}

/* =========================
   ROUTES
========================= */
app.post('/generate', upload.array('images', 10), async (req, res) => {
  try {
    const partner1 = req.body.partner1?.trim();
    const partner2 = req.body.partner2?.trim();

    if (!partner1 || !partner2) {
      return res.status(400).json({
        error: 'Partner names are required'
      });
    }

    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        error: 'At least 2 images are required'
      });
    }

    const { data: db, sha } = await getServerDB();

    const baseSlug =
      `${slugify(partner1)}-${slugify(partner2)}`;

    const slug = getNextAvailableSlug(baseSlug, db);

    const imageUrls = req.files.map(file =>
      `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
    );

    let template = fs.readFileSync(
      path.join(__dirname, 'diary-template.html'),
      'utf8'
    );

    template = template
      .replace('{{IMAGE_URLS}}', JSON.stringify(imageUrls))
      .replace(/{{PARTNER1}}/g, partner1)
      .replace(/{{PARTNER2}}/g, partner2);

    await saveDiaryHTML(slug, template);

    db[slug] = {
      partner1,
      partner2,
      file: `diaries/${slug}.html`,
      createdAt: new Date().toISOString()
    };

    await saveServerDB(db, sha);

    res.json({
      success: true,
      url: `/diary/${slug}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Diary generation failed'
    });
  }
});

app.get('/diary/:slug', async (req, res) => {
  try {
    const { data: db } = await getServerDB();
    const entry = db[req.params.slug];

    if (!entry) {
      return res.status(404).send('Diary not found');
    }

    const rawUrl =
      `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${entry.file}`;

    const html = await axios.get(rawUrl);
    res.send(html.data);

  } catch {
    res.status(404).send('Diary not found');
  }
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
