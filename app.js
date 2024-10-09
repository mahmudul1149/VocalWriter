const express = require('express');
const fs = require('fs');
const multer = require('multer');
const OpenAI = require('openai');
const path = require('path');
const cors = require('cors')
require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors())

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage,   limits: { fileSize: 10 * 1024 * 1024 }, 
});

app.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: 'whisper-1',
    });
    fs.unlinkSync(req.file.path);

    return res.json({ transcription: transcription.text });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return res.status(500).json({ error: 'Error transcribing audio' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
