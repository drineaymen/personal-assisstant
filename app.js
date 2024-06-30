var express = require("express");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cron = require("node-cron");
var scrapper = require("./services/scrapper");
var indexRouter = require("./routes/index");
var path = require("node:path");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("assets"));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use("/", indexRouter);

cron.schedule("0 8 * * *", async () => {
  await new scrapper().linkedin();
  console.log("linkedin Scrapper scheduled.", new Date().toISOString());
});

cron.schedule("0 0 * * 0", () => {
  //db clean here
  console.log("purge db scheduled.", new Date().toISOString());
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).send("Not Found.");
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.status(500).send("error:" + err);
});

module.exports = app;
