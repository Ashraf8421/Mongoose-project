const express = require("express");
const app = express();
const port = 8080;
const mongoose = require("mongoose");
const path = require("path");
const Chat = require("./models/chat.js");
const { deflateSync } = require("zlib");
const methodOverride = require("method-override");
const ExpressError = require("./ExpressError.js");

app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

main()
  .then(() => {
    console.log("connection successful");
  })
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/whatsapp");
}

//index route
app.get("/chats", async (req, res) => {
  try {
    let chats = await Chat.find();
    //console.log(chats);
    res.render("index.ejs", { chats });
  } catch (err) {
    next(err);
  }
});

//new route
app.get("/chats/new", (req, res) => {
  //throw new ExpressError(404,"page not found");
  res.render("new.ejs");
});

// create route
app.post("/chats", async (req, res, next) => {
  try {
    let { from, to, msg } = req.body;
    let newChat = new Chat({
      from: from,
      to: to,
      msg: msg,
      created_at: new Date(),
    });
    await newChat.save();
    res.redirect("/chats");
  } catch (err) {
    next(err);
  }
});

//function asyncwrap
function asyncwrap(fn) {
  return function (req, res, next) {
    fn(req, res, next).catch((err) => next(err));
  };
}

//NEW-Show Route
app.get(
  "/chats/:id",
  asyncwrap(async (req, res, next) => {
    let { id } = req.params;
    let chat = await Chat.findById(id);
    if (!chat) {
      next(new ExpressError(404, "chat not found"));
    }
    res.render("edit.ejs", { chat });
  })
);

//Edit route
app.get("/chats/:id/edit", async (req, res) => {
  try {
    let { id } = req.params;
    let chat = await Chat.findById(id);
    res.render("edit.ejs", { chat });
  } catch (err) {
    next(err);
  }
});

//update route
app.put("/chats/:id", async (req, res) => {
  try {
    let { id } = req.params;
    let { msg: newMsg } = req.body;
    let updatedChat = await Chat.findByIdAndUpdate(
      id,
      { msg: newMsg },
      { runValidators: true, new: true }
    );
    console.log(updatedChat);
    res.redirect("/chats");
  } catch (err) {
    next(err);
  }
});

//Delete route
app.delete("/chats/:id", async (req, res) => {
  try {
    let { id } = req.params;
    let deletedChat = await Chat.findByIdAndDelete(id);
    console.log(deletedChat);
    res.redirect("/chats");
  } catch (err) {
    next(err);
  }
});

app.get("/", (req, res) => {
  res.send("root is working ");
});

//to perfom any action based on the type of error
//here we created a function to handle validation error
//ex: if we want to change anything in the database to validation error
const handleValidationErr = (err) => {
  console.log("This was a Validation error. please follow the rules");
  console.dir(err);
  return err;
};

//to print the name of the error type
app.use((err, req, res, next) => {
  console.log(err.name);
  if (err.name == "ValidationError") {
    //console.log("This was a Validation error. please follow the rules");
    err = handleValidationErr(err);
  }
  next(err);
});

//error handling middleware
app.use((err, req, res, next) => {
  let { status = 500, message = "Some error occured" } = err;
  res.status(status).send(message);
});

app.listen(port, () => {
  console.log("server is listening on port 8080");
});
