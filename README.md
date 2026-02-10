# 💕 Couple Diary Generator

A beautiful, interactive couple diary creator with 3D page-flipping animations. Upload your photos and generate a personalized HTML diary!

## ✨ Features

- **Beautiful UI**: Clean, modern upload interface with gradient backgrounds
- **Smart Image Compression**: Automatically compresses images to reduce file size
- **Flexible Photo Count**: Choose between 3, 5, 7, or 10 photos
- **3D Page Flipping**: Realistic book-flipping animations
- **Drag & Drop**: Intuitive drag-to-flip page interaction
- **Fully Self-Contained**: Generated diary is a single HTML file with embedded images
- **Mobile Responsive**: Works perfectly on all devices
- **Customizable Names**: Add partner names for personalization

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Start the server:**
```bash
npm start
```

3. **Open in browser:**
```
http://localhost:3000
```

## 📖 How to Use

1. **Enter Names**: Type both partner names in the input fields
2. **Choose Photo Count**: Select how many photos you want (3-10)
3. **Upload Photos**: 
   - Click each box to upload a photo
   - First photo becomes the cover
   - Photos are automatically compressed
4. **Generate**: Click "Generate My Diary" button
5. **Download**: Your diary will download as an HTML file
6. **Share**: Open the HTML file in any browser - it works offline!

## 🎨 Customization

### Change Colors

Edit the gradient in `index.html`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Adjust Compression

In `index.html`, modify the compression settings:
```javascript
const MAX_WIDTH = 1200;  // Maximum width
const MAX_HEIGHT = 1600; // Maximum height
canvas.toBlob((blob) => {
    callback(blob);
}, 'image/jpeg', 0.85);  // Quality (0.0 - 1.0)
```

### Change Port

In `server.js`:
```javascript
const PORT = 3000; // Change to your preferred port
```

## 📁 Project Structure

```
couple-diary-generator/
├── index.html           # Upload interface
├── diary-template.html  # Diary template with placeholders
├── server.js           # Express server
├── package.json        # Dependencies
└── README.md          # This file
```

## 🔧 Technical Details

### Image Storage
- Images are converted to base64 data URIs
- Compressed to ~85% quality JPEG
- Resized to max 1200x1600px
- Embedded directly in the HTML file

### File Size
- Each image: ~200-500KB (compressed)
- 10 photos: ~2-5MB total HTML file
- No external dependencies needed

### Browser Compatibility
- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## 🎯 API Endpoints

### `GET /`
Serves the upload interface

### `POST /generate`
Generates the diary HTML
- **Body**: FormData with images and partner names
- **Response**: HTML file download

## 🛠️ Development

Run with auto-reload:
```bash
npm install -g nodemon
npm run dev
```

## 📝 Environment Variables

Create a `.env` file (optional):
```
PORT=3000
MAX_FILE_SIZE=10485760
```

## 🤝 Contributing

Feel free to fork and improve! Some ideas:
- Add more page transition effects
- Include text overlays on photos
- Add background music
- Create more themes/templates
- Multi-language support

## 📜 License

MIT License - feel free to use for personal or commercial projects!

## 👨‍💻 Credits

Created with ❤️ by [@zidhuxd](https://instagram.com/zidhuxd)

Original diary animation concept inspired by 3D CSS transforms and perspective techniques.

## 🐛 Troubleshooting

### Images not uploading?
- Check file size (max 10MB per image)
- Ensure images are in supported format (JPG, PNG, WebP)

### Generated file too large?
- Reduce number of photos
- Lower the compression quality in code
- Reduce MAX_WIDTH/MAX_HEIGHT values

### Server won't start?
- Check if port 3000 is available
- Run `npm install` to ensure dependencies are installed
- Check Node.js version (needs v14+)

## 🎉 Examples

Perfect for:
- Anniversary gifts
- Wedding memories
- Relationship milestones
- Travel photo albums
- Birthday surprises

---

Made with 💖 by zidhuxd
