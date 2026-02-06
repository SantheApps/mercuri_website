# Mercuri Website - Setup Guide

## Running the Website Locally

The website uses modular components (header and footer) that are loaded via JavaScript. This requires running a local web server.

### Option 1: Using Python (Recommended)

```bash
# Navigate to the project directory
cd "/Users/karthikmanjunath/Documents/Mercuri Website"

# Python 3
python3 -m http.server 8000

# Or Python 2
python -m SimpleHTTPServer 8000
```

Then open your browser to: `http://localhost:8000`

### Option 2: Using VS Code Live Server Extension

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 3: Using Node.js http-server

```bash
# Install globally
npm install -g http-server

# Run in project directory
http-server -p 8000
```

Then open your browser to: `http://localhost:8000`

## Project Structure

```
Mercuri Website/
├── index.html              # Home page
├── ai.html                 # AI Agent page
├── features.html           # Features page
├── integrations.html       # Integrations page
├── components/
│   ├── header.html        # Modular header component
│   └── footer.html        # Modular footer component
├── js/
│   └── main.js            # Component loader script
├── css/
│   └── styles.css         # Custom styles
└── assets/
    ├── fonts/
    ├── icons/
    └── images/
```

## How Modular Components Work

Each HTML page includes placeholder divs:

```html
<!-- Header Component -->
<div id="header-placeholder"></div>

<!-- Page Content -->
...

<!-- Footer Component -->
<div id="footer-placeholder"></div>

<!-- Load Components Script -->
<script src="js/main.js"></script>
```

The `js/main.js` script automatically loads the header and footer from the `components/` folder when the page loads.

## Benefits

✅ **Single Source of Truth** - Update header/footer once, changes everywhere
✅ **Consistent Design** - All pages use the same components
✅ **Easy Maintenance** - No need to update multiple files
✅ **Clean Code** - Separation of concerns

## Troubleshooting

### Headers and Footers Not Showing?

Make sure you're running the site through a web server (not just opening the HTML file directly). The browser's security policy prevents loading local files via fetch() without a server.

### Dark Mode Not Working?

The dark mode toggle is in the footer. Make sure the footer has loaded properly and click the moon icon button.
