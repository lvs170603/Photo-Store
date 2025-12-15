# Hyderabad Gallery

A premium, responsive digital gallery designed to showcase your Hyderabad memories with style.

## 🚀 How to Launch

1. **Start the Server**:
   Ensure you are in the `/media/venkat/D Drive/Hyderabad pics` directory and run:
   ```bash
   python3 -m http.server 8000
   ```
   *(Note: This server is required to load the images securely)*

2. **Open the Gallery**:
   Click this link or paste it into your browser:  
   [http://localhost:8000/gallery_app/index.html](http://localhost:8000/gallery_app/index.html)

## ✨ Features

- **Infinite Scroll**: Seamlessly browse through hundreds of photos and videos.
- **Smart Filtering**: Toggle between Photos, Videos, or view All media.
- **Immersive Lightbox**: Click any item to view it in full screen with keyboard navigation support (Arrow keys, Esc).
- **Responsive Design**: Looks great on desktop, tablet, and mobile.
- **Video Previews**: Auto-detects video files and provides metadata-based previews.

## 🛠️ Customization

- **Adding more photos**: Just drop new images into the main folder and regenerate the `data.js` list (or ask me to do it!).
- **Themes**: Edit `style.css` to change the accent colors or fonts.
