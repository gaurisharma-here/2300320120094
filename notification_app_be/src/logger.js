import axios from "axios";
import settings from "./config.js";
import getToken from "./authService.js";

async function sendLog(stack, level, pkg, message) {
  try {
    const token = await getToken();
    await axios.post(`${settings.baseUrl}/logs`, {
      stack,
      level,
      package: pkg,
      message,
    }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    // silent fail — logger should never crash the app
  }
}

export default sendLog;
