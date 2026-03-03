// Yellow Jack API Configuration
// Update this URL after deploying backend to Railway

// For local development:
// const API_URL = 'http://localhost:3000';

// For production (Railway):
const API_URL = 'https://yellow-jack-production.up.railway.app';

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { API_URL };
}

