const bodyParser = require("body-parser");
const express = require("express");
const ejs = require("ejs");
const app = express();
const path = require("path");
const router = require("./database/connection");
const dbconnection = require("./database/dbConnection");
const userDet = require("./database/userDet")
const passport = require("passport");
var use;
var userToken;

// setting up the folder public to fetch the static files.
app.use(express.static("public"));
app.set("view engine", "ejs");
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


const { Passport } = require("passport/lib");

app.get("/", async (req, res) => {
  res.render("landing");
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
      res.cookie(`jwt`, token, {
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

app.post("/login", async (req, res) => {
  try {
    const userName = req.body.userName;
    const loginDetDb = await userDetModel.findOne({ userName: userName });
    const password = req.body.password;
    const pwComp = await bcrypt.compare(password, loginDetDb.password);
    if (pwComp) {
      const token = await loginDetDb.generateAuthToken();
      res.cookie("jwt", token, {
        httpOnly: true,
      });
      res.cookie("id", loginDetDb._id, {
        httpOnly: true,
      });
      res.redirect("/activity");
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

app.get("/activity", auth, async (req, res) => {

  const person = await userDetModel.findOne({ _id: req.cookies.id });
  const post = person.post;
  // console.log(post);

  res.render("activity", { posts: post });

});

app.get("/expenses", auth, async (req, res) => {

  const person = await userDetModel.findOne({ _id: req.cookies.id });
  const post = person.post;

  res.render("expenses", { posts: post });
});

app.get("/chart", auth, function (req, res) {
  Post.find({}, function (err, posts) {
    res.render("chart", { posts: posts });
  });
});

app.get("/compose", auth, (req, res) => {
  res.render("compose");
});

// Will be using it to store the information from the compose page.
app.post("/compose", auth, async (req, res) => {

  const person = await userDetModel.findOne({ _id: req.cookies.id });
  const id = person._id;
  // console.log(id);

  person.post = person.post.concat({
    title: req.body.blogTitle,
    content: req.body.blogBody,
    normal: req.body.normal,
    investment: req.body.investment,
    savings: req.body.savings,
    date: currentDay.toString()
  });

  // // saved the post to the collections
  await person.save(function (err) {
    if (!err) {
      res.redirect("/activity");
    }
  });
});


app.get("/posts/:postId", auth, function (req, res) {
  const requestedPostId = req.params.postId;
  Post.findOne({ _id: requestedPostId }, function (err, post) {
    if (!err) {
      res.render("blogs", { postTitle: post.title, postContent: post.content });
    }
  });
});

app.get("/login", (req, res) => {
  res.render("loginPage");
});




// **************Auth by Google***************
// **************Auth by Google***************
// **************Auth by Google***************
// **************Auth by Google***************




app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

const res = require("express/lib/response");
const { redirect } = require("express/lib/response");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
try {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.client_ID,
        clientSecret: process.env.client_sec,
        callbackURL: "/google",
      },
      async (accestoken, refreshtoken, profile, done) => {
        const userId = profile.emails[0].value;

        const loginDetDb = await userDetModel.findOne({
          userName: userId,
        });
        console.log(loginDetDb);
        if (loginDetDb) {
          userToken = await loginDetDb.generateAuthToken();
          console.log("already a user");
          done(null, loginDetDb);
        } else {
          const saveGUserDet = new userDetModel({
            firstName: profile.name.givenName,
            googleId: profile.id,
            lastName: profile.name.familyName,
            userName: profile.emails[0].value,
          });
          await saveGUserDet.save();
          userToken = await saveGUserDet.generateAuthToken();
          console.log("new user");
          done(null, saveGUserDet);
        }
      }
    )
  );
} catch (err) {
  console.log("caught the error manually this is conosle.log");
  console.log(err);
}

passport.serializeUser((user, done) => {
  use = user;
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  userDetModel.findById(id).then((user) => {
    done(null, user);
  });
});

app.get("/google", passport.authenticate("google"), (req, res) => {
  res.cookie(`jwt`, userToken, {
    httpOnly: true,
  });
  res.cookie("id", use._id, {
    httpOnly: true,
  });
  res.redirect("/login");
});

// listening the site on port 3000
app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000 on " + currentDay);
});