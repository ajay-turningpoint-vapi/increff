const crypto = require("crypto");

const USERNAME = process.env.API_USERNAME;
const PASSWORD_HASH = hash(process.env.API_PASSWORD);

function basicAuth(req, res, next) {
  const username = req.headers["x-username"];
  const password = req.headers["x-password"];

  if (!username || !password) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (username !== USERNAME || hash(password) !== PASSWORD_HASH) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  req.auth = { type: "basic", user: username };

  next();
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

module.exports = basicAuth;
