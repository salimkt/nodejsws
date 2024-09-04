const axios = require("axios");
const setToken = (token) => {
  axios.defaults.headers.get["Authorization"] = "Bearer " + token;
  axios.defaults.headers.post["Authorization"] = "Bearer " + token;
  axios.defaults.headers.put["Authorization"] = "Bearer " + token;
};

module.exports = { setToken };
