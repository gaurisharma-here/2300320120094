import dotenv from "dotenv";
dotenv.config();

const settings = {
  baseUrl: process.env.BASE_URL,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  port: process.env.PORT || 5000,
};

export default settings;
