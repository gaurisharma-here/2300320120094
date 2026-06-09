import axios from "axios";

const BASE = "http://localhost:5000/api";

export const getAllNotifications = () => axios.get(`${BASE}/notifications/all`);
export const getTopNotifications = (n) => axios.get(`${BASE}/notifications?topN=${n}`);
