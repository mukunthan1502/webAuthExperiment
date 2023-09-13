const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const authenticationToken = require("./verifyToken");
const { verifyToken, validateAdminUserRole } = authenticationToken;
const app = express();
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

const SECRET = "mySecretKey"; // Secret key for JWT signing and verification
const REFRESH_SECRET = "refreshSecret"; // Secret key for refresh token
const TOKEN_DURATION = 10;
const REFRESH_TOKEN_DURATION = 30;
const PORT = 5001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.post("/login", (req, res) => {
  const csrfToken = crypto.randomBytes(24).toString("hex");

  const accessToken = jwt.sign({ user: "user_id" }, SECRET, {
    expiresIn: TOKEN_DURATION,
  });
  const refreshToken = jwt.sign({ user: "user_id" }, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_DURATION,
  });

  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    maxAge: 90000,
  });

  res.json({
    accessToken,
    tokenDuration: TOKEN_DURATION,
    refreshDuration: REFRESH_TOKEN_DURATION,
  });
});

// Endpoint to refresh the access token using the refresh token stored in httpOnly cookie
app.post("/refresh", (req, res) => {
  const { refreshToken } = req.cookies;
  const csrfTokenFromHeader = req.headers["x-csrf-token"];
  const csrfTokenFromCookie = req.cookies.csrfToken;

  if (
    !(
      csrfTokenFromHeader &&
      csrfTokenFromCookie &&
      csrfTokenFromHeader === csrfTokenFromCookie
    )
  ) {
    res.status(403).json({ error: "Invalid CSRF Token" });
    return;
  }

  if (!refreshToken) {
    return res.sendStatus(403);
  }

  jwt.verify(refreshToken, REFRESH_SECRET, (err, user) => {
    console.log("refresh::err", err);
    if (err) return res.sendStatus(403);

    const accessToken = jwt.sign({ user: user.user }, SECRET, {
      expiresIn: TOKEN_DURATION,
    });
    res.json({
      accessToken,
      tokenDuration: TOKEN_DURATION,
      refreshDuration: REFRESH_TOKEN_DURATION,
    });
  });
});

app.post("/logout", (req, res) => {
  // Set the cookies to expire in the past
  res.cookie("refreshToken", "", { expires: new Date(0), httpOnly: true });
  res.cookie("csrfToken", "", { expires: new Date(0) });
  /* add refresh token to blacklist */
  console.log("logout");
  res.status(200).send("Logged out successfully");
});

app.post("/sampleApi", verifyToken, (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res
      .status(403)
      .send({ status: "fail", statusMsg: "TokenExpiredError" })
      .end();
  }
  res.status(200).send({ status: "Successful sampleAPi" }).end();
});
