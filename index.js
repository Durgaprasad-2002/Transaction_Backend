const express = require("express");
const BodyParser = require("body-parser");
const ConnectionToDB = require("./ConnectionToDB");
const router = require("./routes/index");
const cors = require("cors");

const PORT = process.env.PORT || 8000;

const app = express();

ConnectionToDB.then(() => console.log("Connected to Database")).catch(() =>
  console.log("Failed to Connect to Database")
);

app.use(cors());

app.use(BodyParser.json({ extended: false }));

app.use(BodyParser.urlencoded({ extended: false }));

app.use("/api", router);

app.listen(PORT, () => console.log(`Server Started at PORT:${PORT}`));
