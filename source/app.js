const bodyParser = require("body-parser");
const express =require("express");
const ejs=require('ejs');
const app=express();
const path=require("path");
const router=require("./database/connection");
const dbconnection=require("./database/dbConnection");

// setting up the folder public to fetch the static files.
app.use(express.static("public"));

app.set('view engine','ejs');

// setting up bodyparser to take input from the user.
app.use(bodyParser.urlencoded({ extended: true }));

const cookieParser = require("cookie-parser");
const auth = require("./middleware/auth");
const userDetModel = require("./database/userDet");
const bcrypt = require("bcryptjs");
require("./database/dbConnection");
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// fetching time
const currentDay = require("./JsFiles/time");
// requiring post schema to store post data
const Post = require("./database/composeData")


app.get("/", async (req, res) => {

  const user = await userDetModel.findOne({ _id: req.cookies.id });
  res.render("landing");
  // console.log(user);
});


app.get("/registration", (req, res) => {
  res.render("registrationPage");
});

app.post("/registration", async (req, res) => {
  try {
    const fetchPwd = req.body.password;
    const secPwd = await bcrypt.hash(fetchPwd, 10);
    const pwComp = await bcrypt.compare(req.body.cnfmPassword, secPwd);
    if (pwComp) {
      // console.log(req.body);
      const saveUserDet = new userDetModel({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        password: secPwd,
        cnfmPassword: secPwd,
      });
      // console.log(saveUserDet);
      await saveUserDet.save();
      const token = await saveUserDet.generateAuthToken(); //generateAuthToken is user defined
      res.cookie(`jwt register`, token, {
        // expires: new Date(Date.now() + 8 * 3600000),
        httpOnly: true,
      });
      res.render("loginPage");
    } else {
      res.send("password didn't match");
    }
  } catch (err) {
    console.log(err);
  }
});


app.get("/login", (req, res) => {
  res.render("loginPage");
  // console.log(req.cookies.jwt);
});


app.post("/login", async (req, res) => {
  try {
    const userName = req.body.userName;
    const loginDetDb = await userDetModel.findOne({ userName: userName });
    const password = req.body.password;
    const pwComp = await bcrypt.compare(password, loginDetDb.password);
    // console.log(loginDetDb);
    if (pwComp) {
      const token = await loginDetDb.generateAuthToken();
      res.cookie("jwt", token, {
        // expires: new Date(Date.now() + 3000000),
        httpOnly: true,
      });
      res.cookie("id", loginDetDb._id, {
        // expires: new Date(Date.now() + 3000000),
        httpOnly: true,
      });
      // res.render("index");
      res.redirect("/activity");
      // res.render("authenticate");
      // console.log(token);
    } else {
      res.send("password or user id wrong");
    }
  } catch (err) {
    res.send("error");
    console.log(err);
  }
});


app.get("/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((currentToken) => {
      // console.log(currentToken.token);
      // console.log(req.token);
      return currentToken.token !== req.token;
    });
    await res.clearCookie("jwt");
    await res.clearCookie("id");
    await req.user.save();
    res.redirect("/");
    console.log("logout successfully");
  } catch (err) {
    console.log(err);
  }
});

app.get("/activity", function (req, res) {

  Post.find({}, function (err, posts) 
  {
    res.render("activity", {posts: posts});
  });

});

app.get("/expenses", function (req, res) {

  Post.find({}, function (err, posts) 
  {
    res.render("expenses", {posts: posts});
  });

});


app.get("/chart", function (req, res) {

  Post.find({}, function (err, posts) 
  {
    res.render("chart", {posts: posts});
  });

});


app.get("/compose", auth, (req, res) => {
  res.render("compose");
});

// Will be using it to store the information from the compose page.
app.post("/compose", function (req, res) {

// taking all the details from the user into a const post
const post = new Post({
    title:req.body.blogTitle, 
    content:req.body.blogBody,
    normal:req.body.normal,
    investment:req.body.investment,
    savings:req.body.savings,
    date: currentDay.toString()
});

// console.log(post);

  // saved the post to the collections 
  post.save(function(err){
    if(!err){
      res.redirect("/activity");
    }
  });

});


app.get("/posts/:postId", function (req, res) {
  const requestedPostId = req.params.postId;

  Post.findOne({_id: requestedPostId}, function(err, post){
    if(!err)
    {
      res.render("blogs", { postTitle: post.title, postContent: post.content });
    }
  });

});



// listening the site on port 3000
app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000 on "+ currentDay);
});