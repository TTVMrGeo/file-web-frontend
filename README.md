# Download Page Frontend

This is the frontend for the file download service, hosted on GitHub Pages.

## Features
- Responsive design that works on mobile and desktop
- Real-time form validation
- Integration with SendFox API via backend
- Automatic file download after contact creation
- Clean, modern UI with animations

## Setup Instructions

### 1. Update Configuration
In `script.js`, update these values:

```javascript
const CONFIG = {
    BACKEND_URL: 'https://your-project-name.up.railway.app', // Your Railway backend
    FILE_NAME: 'your-file.pdf', // Your actual file name
    FILE_DISPLAY_NAME: 'Your Resource Name', // Display name
    FILE_SIZE: '1.5 MB' // Display size
};