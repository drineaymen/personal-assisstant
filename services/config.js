const dotenv = require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
});

const result = dotenv;
if (result.error) {
  throw result.error;
}
const { parsed: envs } = result;

module.exports = envs;
