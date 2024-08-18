const express = require("express");
require('./db')
const userRouter = require("./routes/user");

const app = express();
app.use(express.json())
app.use("/api/user", userRouter);


const port = process.env.port || 5000
app.listen(port, () => {
  console.log("the port is listening on port " + port);
});
