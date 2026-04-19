const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.error('[API] VITE_API_URL is not set. Add it to your .env file.');
}

export default API_BASE_URL;
