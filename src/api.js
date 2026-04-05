const API_BASE_URL = import.meta.env.VITE_API_URL || 
    (window.location.hostname.includes('render.com') 
        ? "https://proquizmasterbackend.onrender.com" // Update this if the backend URL is known
        : "http://localhost:5001");

export default API_BASE_URL;
