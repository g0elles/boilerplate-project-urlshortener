require('dotenv').config();
const express = require('express');
const dns = require("dns");
const cors = require('cors');
const app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

const Schema = mongoose.Schema;
const dnsPromises = dns.promises;
const NewUrlSchema = new Schema({
  initial: String,
  new: Number
});

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

const Url = mongoose.model("Url", NewUrlSchema);
// Basic Configuration
const port = process.env.PORT || 3001;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// With this we validate if the input it's a url
function UrlValidation(url) {
  const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
  return urlRegex.test(url);
}

app.get("/api/shorturl/:shortenedUrl", async function (req, res) {
  const findUrl = await Url.findOne({
    new: req.params.shortenedUrl
  });

  if (findUrl) {
    const {
      initial: originalUrl
    } = findUrl;
    const urlWithProtocol = originalUrl.includes("http") ?
      originalUrl :
      "https://" + originalUrl;
    res.status(301).redirect(urlWithProtocol);
  } else {
    res.status(404)
  }
});


app.post("/api/shorturl", async function (req, res, next) {
  const {
    url: url
  } = req.body;

  try {
    const urlWithoutProtocol = url.replace(/^https?:\/\//i, "");
    dnsPromises.lookup(urlWithoutProtocol)
    .then((VASL)=>{


    })
    .catch((ERROR)=>{})
  } catch (e) {
    res.json({
      error: "invalid URL"
    });
  }

  let exist = await Url.findOne({initial: url});

  if(exist) res.json({ original_url: url, short_url: exist.new})

  const lastCreatedUrl = await Url.findOne().sort({
      field: "asc",
      _id: -1
    })
    .exec();

  try {
    const newUrl = new Url({
      initial: url,
      new: lastCreatedUrl ? lastCreatedUrl.new + 1 : 1
    });
    const finalUrl = await newUrl.save();

    res.json({
      original_url: finalUrl.original,
      short_url: finalUrl.new
    });
    next();
  } catch (err) {
    res.status(500).send(err);
  }
});


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});