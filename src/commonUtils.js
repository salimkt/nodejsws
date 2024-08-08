const axios = require("axios");
const { desc_table } = require("./constants.js");

const pushLogs = (message, epochNanoseconds) => {
  // axios.get("http://api.apis.guru/v2/list.json").then((res) => {
  //   console.log(res);
  // });
  console.log(message);
  // axios
  //   .post("https://grafana.netstratum.com/loki/api/v1/push", {
  //     "streams": [
  //       {
  //         "stream": {
  //           "app": "mobile"  //Change app name
  //         },
  //         "values": [[epochNanoseconds + "", message]]
  //       }
  //     ]
  //   })
  //   .then(() => {
  //     console.log("Grafana success");
  //   })
  //   .catch(() => {
  //     console.log("Grafana fail");
  //     setTimeout(() => {
  //       pushLogs(message, epochNanoseconds);
  //     }, 1000);
  //   });
};

const explaineCode = (code) => {
  return desc_table[code];
};

const serializeMsg = (msg) => {
  let formattedString = "";
  for (const key in msg) {
    if (msg.hasOwnProperty(key)) {
      formattedString += `${key} = ${msg[key]} `;
    }
  }
  return formattedString;
  // return msg;
};

module.exports = { pushLogs, explaineCode, serializeMsg };
