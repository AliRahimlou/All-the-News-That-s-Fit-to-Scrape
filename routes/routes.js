const app = require('express').Router();

var express = require('express')

var db = require("../models");



// Routes

// GET request to render handlebars page
app.get("/", function(req, res) {
    db.Article.find({saved: false}, function(error, data) {
        var hbsObject = {
            article: data
        };
        console.log(hbsObject);
        res.render("home", hbsObject);
    })
})

app.get("/saved", function(req, res) {
    db.Article.find({saved: true})
    .populate("notes")
    .exec(function(error, articles) {
        var hbsObject = {
            article: articles
        };
        res.render("saved", hbsObject);
    });
});

// A GET route for scraping the echoJS website
app.get('/scrape', function(req, res) {
    request('http://www.echojs.com', function(error, response, html) {
        var $ = cheerio.load(html);

        $('article h2').each(function(i, element) {
            let result = {};

            result.title = $(this).children('a').text();
            result.link = $(this).children('a').attr('href');

            // Create a new article using result object built from scraping
            db.Article.create(result)
                .then(function(dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function(err) {
                    console.log(err);
                });
        });
        // Send a message to the client
        res.send("Scrape Complete");
    });
});

// This will get the articles we scraped from the mongoDB
app.get("/articles", function(req, res) {
    db.Article.find({})
    .then(function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.json(err);
    });
});

// Grab an article by it's ObjectId
app.get('/articles/:id', function(req, res) {
    db.Article.findOne({ _id: req.params.id })
    .populate('note')
    .then(function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.json(err);
    });
});

// Save an article
app.post('/articles/save/:id', function(req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: true})
    .then(function(dbArticle) {
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.json(err);
    });
});

// Delete an article
app.post('/articles/delete/:id', function(req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { saved: false, notes: [] }, function(err) {
        if (err) {
            console.log(err);
            res.end(err);
        }    
        else {
            db.Note.deleteMany({ article: req.params.id })
            .exec(function(err) {
                if (err) {
                    console.log(err);
                    res.end(err);
                } else
                res.send("Article Deleted");
            });
        }        
    }); 
});

// Create a new note
app.post("/notes/save/:id", function(req, res) {
    var newNote = new db.Note ({
        body: req.body.text,
        article: req.params.id
    });
    newNote.save(function(error, note) {
        return db.Article.findOneAndUpdate({ _id: req.params.id }, {$push: {notes: note}})
    .exec(function(err) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            res.send(note);
        }
        });    
    });
});    

// Delete a note
app.delete('/notes/delete/:note_id/:article_id', function(req, res) {
    db.Note.findOneAndRemove({ _id: req.params.note_id }, function(err) {
        if (err) {
            console.log(err);
            res.send(err);
        } else {
            db.Article.findOneAndUpdate({ _id: req.params.article_id }, {$pull: {notes: req.params.note_id}})
            .exec(function(err) {
                if (err) {
                    console.log(err);
                    res.send(err);
                } else {
                    res.end("Note Deleted");
                }
            });
        }
    });
});

module.exports = app