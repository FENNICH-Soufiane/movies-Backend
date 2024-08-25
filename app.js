const express = require("express");
require('./db')
const userRouter = require("./routes/user");

const cors = require("cors");
const { handleNotFound } = require("./utils/helper");
const { errorHandler } = require("./middlewares/error");

const app = express();
app.use(cors());
app.use(express.json())
app.use("/api/user", userRouter);
app.use("/*", handleNotFound);
app.use(errorHandler);

const port = process.env.port || 5000
app.listen(port, () => {
  console.log("the port is listening on port " + port);
});
