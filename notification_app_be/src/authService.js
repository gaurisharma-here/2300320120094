import axios from "axios";
import settings from "./config.js";

let cachedToken = null;
let tokenExpiry = null;

async function fetchToken() {
  const response = await axios.post(`${settings.baseUrl}/auth`, {
    email: "gauri.23b0121301@abes.ac.in",
    name: "gauri sharma",
    rollNo: "2300320120094",
    accessCode: "cXuqht",
    clientID: settings.clientId,
    clientSecret: settings.clientSecret,
  });
  const token = response.data.access_token || response.data.token || response.data.accessToken;
  cachedToken = token;
  tokenExpiry = Date.now() + 50 * 60 * 1000;
  return token;
}

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  return await fetchToken();
}

export default getToken;
