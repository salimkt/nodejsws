const env = "dev";

const auths = {
  dev: "https://us1-dev.fohik.com/auth/realms/",
  test: "https://us3-test.fohik.com/auth/realms/",
};

const auth_url = auths[`${env}`];
module.exports = { auth_url };
