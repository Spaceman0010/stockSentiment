//update: added comments
// this is the one place where my frontend knows "where is my backend running"
// this makes the code clean because i dont repeat URLs everywhere.

import axios from "axios";

// If I set REACT_APP_API_BASE_URL, it uses that, otherwise it uses localhost 
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:5050",
  timeout: 60000, // I give it 60 seconds so long backtests don't fail instantly
});