var sqlite3 = require('sqlite3').verbose();
var express = require('express');
var http = require('http');
var path = require("path");
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require("express-rate-limit");
var app = express();
var server = http.createServer(app);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});


var db = new sqlite3.Database('./database/kedb.db');


app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'./public')));
app.use(helmet());
app.use(limiter);

db.run('CREATE TABLE IF NOT EXISTS incident_master(incident_no TEXT, region TEXT, asset TEXT,hostname TEXT)');

app.get('/', function(req,res){
  res.sendFile(path.join(__dirname,'./public/form.html'));
});

// Insert
app.post('/add', function(req,res){
  db.serialize(()=>{
    db.run('INSERT INTO incident_master(incident_no,region,asset,hostname) VALUES(?,?,?,?)', [req.body.incident_no, req.body.region, req.body.asset,req.body.hostname], function(err) {
      if (err) {
        return console.log(err.message);
      }
      console.log("New Incident has been added");
      res.send("New Incident has been added into the database with ID = "+req.body.incident_no+ " and region = "+req.body.region);
    });
});
});

// View
app.post('/view', function(req,res){
  db.serialize(()=>{
    db.each('SELECT incident_no Incident, region Region, asset Asset FROM incident_master WHERE incident_no =?', [req.body.incident_no], function(err,row){     //db.each() is only one which is funtioning while reading data from the DB
      if(err){
        res.send("Error encountered while displaying");
        return console.error(err.message);
      }
      res.send(` Incident No.: ${row.Incident},Region: ${row.Region},Asset: ${row.Asset}`);
      console.log("Entry displayed successfully");
    });
  });
});

//UPDATE
app.post('/update', function(req,res){
  db.serialize(()=>{
    db.run('UPDATE incident_master SET region = ?,asset=? WHERE incident_no = ?', [req.body.region,req.body.asset,req.body.incident_no], function(err){
      if(err){
        res.send("Error encountered while updating");
        return console.error(err.message);
      }
      res.send("Entry updated successfully");
      console.log("Entry updated successfully");
    });
  });
});

//DELETE
app.post('/delete', function(req,res){
  db.serialize(()=>{
    db.run('DELETE FROM incident_master WHERE incident_no = ?', req.body.incident_no, function(err) {
      if (err) {
        res.send("Error encountered while deleting");
        return console.error(err.message);
      }
      res.send("Entry deleted");
      console.log("Entry deleted");
    });
  });
});

// Closing the database connection.
app.get('/close', function(req,res){
  db.close((err) => {
    if (err) {
      res.send('There is some error in closing the database');
      return console.error(err.message);
    }
    console.log('Closing the database connection.');
    res.send('Database connection successfully closed');
  });
});

server.listen(3000, function(){
  console.log("server is listening on port: 3000");
});