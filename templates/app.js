export default `
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const compression = require("compression");
{{#if input.logging}}
const morgan = require("morgan")
const fs = require("fs")
const path = require("path")
{{/if}}
{{!-- Auth imports --}}
{{{authImports input.authentication input.roles}}}

const PORT = process.env.PORT || "3000";

// Import routes

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Parses JSON bodies
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded form data
app.use(helmet()); // Set security HTTP headers
{{!-- Log middleware --}}
{{#if input.logging}}
app.use(morgan("combined", { stream: fs.createWriteStream(path.join(process.pwd(), 'access.log'), { flags: 'a' }) })); // Logging to file
{{/if}}
app.use(compression()); // Gzip compression
{{!-- Auth middleware --}}
{{#if input.authentication}}
app.use(passport.initialize());
require("./middlewares/passport")(passport);
{{/if}}

{{!-- Error handling middleware --}}
{{#if input.error_handling}}
app.use((err, req, res, next) => {
  console.error("Custom error handler - " + err.stack);

  // Log the error to a file
  const logStream = fs.createWriteStream(path.join(__dirname, 'error.log'), { flags: 'a' });
  logStream.write(new Date().toISOString() + ': ' + err.stack + '\\n');
  logStream.end();

  res.status(500).send("Something went wrong!");
});
{{else}}
app.use((err, req, res, next) => {
  console.error("Custom error handler - " + err.stack);
  res.status(500).send("Something went wrong!");
});
{{/if}}

// Routes
{{{authRoutes input.authentication}}}

// Start the server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;
