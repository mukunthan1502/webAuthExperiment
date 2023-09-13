const jwt = require("jsonwebtoken");
require("dotenv").config();

/*
module.exports.generateAccessToken = ({ username, userID, role }) => {
  const accessToken = jwt.sign(
    { username, userID, role },
    process.env.JWT_SECRET,
    {
      expiresIn: parseInt(process.env.JWT_SESSION_TIME),
    }
  );
  return { jwt: accessToken };
};
*/

module.exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // && return first falsy or last value
  //   console.log("req.headers", req.headers);
  // console.log("authHeader", authHeader);
  // console.log("token", token);

  if (token === undefined || token === null)
    return res
      .status(401)
      .send({
        status: "fail",
        statusMsg: "Authorization Token not send in header. Please login first",
      })
      .end();

  jwt.verify(token, "mySecretKey", (err, payload) => {
    console.log("err, payload", err, payload);
    if (err)
      return res.status(403).send({ status: "fail", statusMsg: err }).end();

    res.locals.username = payload.username;
    res.locals.userID = payload.userID;
    res.locals.role = payload.role;

    next();
  });
};

module.exports.validateAdminUserRole = (req, res, next) => {
  const { username, role } = res.locals;

  console.log(username, role);

  role === "admin"
    ? next()
    : res
        //
        .send({
          status: "fail",
          statusMsg: `username:${username} current role has no access rights for current action. Current Role: ${role}`,
        })
        .status(500)
        .end();
};
