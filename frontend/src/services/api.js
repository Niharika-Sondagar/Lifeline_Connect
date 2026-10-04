import axios from "axios"; // used to make https request to the backend server

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json", // data is in json format 
  },
});

// Attach JWT token automatically to every request if present
// An interceptor allows Axios to modify/intercept a request before it is sent.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // if token is present in local storage, it is added to the request headers as a
    //  Bearer token for authentication
    return config; // request is sent to the backend server with the modified config
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
