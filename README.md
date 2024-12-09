# Bunserv: Simple Development Server with Live Reload

Bunserv is a lightweight development server and build tool designed to streamline JavaScript and Malina.js development. It uses Bun.js for serving files and esbuild for efficient bundling.

## Features

- **Fast Build Process**: Powered by esbuild, supporting bundling, minification, and custom plugins.
- **Live Reload**: Automatically reloads the browser when files are updated in development mode.
- **WebSocket Support**: Implements live reload via WebSockets for smooth development experience.
- **Serve Static Files**: Simple and efficient static file serving.

## Usage

### Install Dependencies
Ensure you have Bun installed. 

```js
import bunserv from "@dififa/malinajs-spa";

bunserv({
	port: 3000, // default
	publicDir: 'public' // default
	esbuildOptions: {} // default
});
```
### Project tree example
```
malina-project/
├── public/                 # Directory for static files
│   ├── index.html          # Main HTML file
│   ├── main.css            # Example stylesheet
│   ├── malinajs.svg        # Example image file
│   └── main.js             # Example bundle script
├── src/                    # Source directory for JavaScript/TypeScript files
│   ├── main.js             # Entry point for the application
│   ├── App.xht             # Example application logic
│   ├── About.xht           # Example application logic
│   └── components/         # Directory for UI components
│       └── Header.xht      # Example component
├── bun.lockb               # Bun lock file
├── README.md               # Project documentation
└── package.json            # Project dependencies and metadata

```