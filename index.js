import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import { htmlToText } from "html-to-text";
import { readFile } from 'fs/promises';

const rawData = await readFile('./data.json', 'utf-8');
const data = JSON.parse(rawData).reverse();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
const PORT = process.env.PORT || 3000;

function getMaxId() {
  let maxId = 0;
  for (const post of data) {
    if (post.id > maxId) maxId = post.id;
  }
  return maxId;
}

let cur_id = getMaxId();

app.get("/post", (req, res) => {
  res.render("post"); 
});

app.post("/post", (req, res) => {
  const date = new Date();
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric"
  });

  const blog = req.body["blog_content"];
  const plainText = htmlToText(blog, { wordwrap: false });

  cur_id += 1;
  const new_obj = {
    id: cur_id,
    heading: req.body["title"],
    author: req.body["author_name"],
    date: formattedDate,
    read_time: Math.floor(plainText.length / 1400) + " min",
    blog_preview: plainText.slice(0, 300),
    blog_content: blog,
  };

  data.push(new_obj);
  fs.writeFileSync("./data.json", JSON.stringify(data, null, 2), "utf8");
  res.redirect("/");
});

app.get("/view/:id", (req, res) => {
  const post = data.find((p) => p.id === parseInt(req.params.id));
  if (post) {
    res.render("view", { post });
  } else {
    res.status(404).send("Post not found");
  }
});

app.get("/", (req, res) => {
  res.render("index", {
    posts: data,
    year: new Date().getFullYear()
  });
});


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
