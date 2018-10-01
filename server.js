var express = require("express");
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");
var db = require("./models");
var PORT = process.env.PORT || 3000;
var app = express();
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines"
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// Routes
app.get("/scrape", function (req, res) {
    axios.get("https://www.cnn.com/").then(function (response) {
        var $ = cheerio.load(response.data);
        $("h1").each(function (i, element) {
            var result = {};

            result.title = $(this)
                .children("a")
                .text();
            result.link = $(this)
                .children("a")
                .attr("href");
            result.summary = $("#post_1829398554 > div.item__content.js_item-content.item__content--thumb > div > p")
                .text();
            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, send it to the client
                    return res.json(err);
                });
        });
        res.send("Scrape Complete, Please press BACK to view your articles");
    });
});

app.get("/articles", function (req, res) {
    db.Article.find({})
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.get("/articles/:id", function (req, res) {
    db.Article.findOne({ _id: req.params.id })
        .populate("note")
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.get('/', function (req, res) {
    var article = new Article(req.query);
    article.retrieveAll(res);

});

app.get('/detail', function (req, res) {
    var article = new Article(req.query);
    article.retrieveOne(req, res);


});

app.get('/submit', function (req, res) {
    var note = new Note(req.query);
    console.log('note instance ' + note);
    note.saveNote(req, res, Article, note);

});

app.get('/noteMODELS', function (req, res) {
    var article = new Article(req.query);
    console.log('article instance ' + article);
    article.viewNotes(req, res, Note, article);
});

app.listen(PORT, function () {
    console.log('app listening on port ' + PORT);
});

app.post("/articles/:id", function (req, res) {
    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});