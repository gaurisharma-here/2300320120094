import axios from "axios";
import settings from "./config.js";
import getToken from "./authService.js";

async function fetchAllNotifications() {
  const token = await getToken();
  const response = await axios.get(`${settings.baseUrl}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data.notifications && Array.isArray(data.notifications)) return data.notifications;
  return [];
}

export default fetchAllNotifications;
