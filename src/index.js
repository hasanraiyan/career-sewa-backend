import config from "./config/env.js";

// Access any configuration
const port = config.server.port;
const dbUri = config.database.uri;
const isDev = config.env.isDevelopment;

console.log(`Server is running on port ${port}`);

console.log(`Database URI: ${dbUri}`);
console.log(`Is Development: ${isDev}`);