const mongoose = require("mongoose");

const digiDiarySchema = new mongoose.Schema({
    title: String,
    content: String,
    normal: Number,
    investment: Number,
    savings: Number,
    date: String
});

// Creating a collection model for the new schema created:
// the collection name would be => posts, here we need to input in singular format.
// we need to include the schema which is gonna be the postSchema created above.
const Post = mongoose.model("Post", digiDiarySchema);

// exporting the post to access in app.js
module.exports = Post;