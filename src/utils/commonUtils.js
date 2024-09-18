const axios = require("axios");
const { desc_table } = require("../constants.js");

const pushLogs = (message, epochNanoseconds) => {
  // axios.get("http://api.apis.guru/v2/list.json").then((res) => {
  //   console.log(res);
  // });
  console.log(message);
  axios
    .post("https://grafana.netstratum.com/loki/api/v1/push", {
      streams: [
        {
          stream: {
            app: "ncs_client", //Change app name
          },
          values: [[epochNanoseconds + "", message]],
        },
      ],
    })
    .then(() => {
      console.log("Grafana success");
    })
    .catch(() => {
      console.log("Grafana fail");
      setTimeout(() => {
        pushLogs(message, epochNanoseconds);
      }, 1000);
    });
};

const explaineCode = (code) => {
  return desc_table[code];
};

const serializeMsg = (msg) => {
  let formattedString = "";
  for (const key in msg) {
    if (msg.hasOwnProperty(key)) {
      formattedString += `${key}=${
        typeof msg[key] == "string" ? msg[key] : JSON.stringify(msg[key])
      } `;
    }
  }
  return formattedString;
  // return msg;
};

async function fetchLokiLogs(appName, start, end) {
  // console.log("Lokilog---------apifun----", appName);
  const baseUrl = "https://grafana.netstratum.com/loki/api/v1/query_range"; // Replace with your Loki URL
  // LogQL query to fetch logs with app="mobile"
  const query = `{app="${appName}"}`;
  // Time range (in nanoseconds since the epoch)
  // const start = new Date().getTime() * 1e6 - 60 * 1e9; // 60 seconds ago
  // const end = new Date().getTime() * 1e6; // Now
  const url = `${baseUrl}?query=${encodeURIComponent(
    query
  )}&start=${start}&end=${end}&limit=100`;

  try {
    const response = await axios.get(url);
    console.log("Loki data----------", response.data); // Logs fetched from Loki
    return response;
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return error;
  }
}

module.exports = { pushLogs, explaineCode, serializeMsg, fetchLokiLogs };
