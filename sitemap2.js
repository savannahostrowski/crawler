var https = require('https');
var DOMParser = require('xmldom').DOMParser;
var csv = require('fast-csv');
var fs = require('fs');

var options = {
  hostname: '',
  path: '', 
  agent: false
};

var requestQueue = [];
var csvStream = csv.createWriteStream({headers:true});
var writableStream = fs.createWriteStream("errorLog.csv");

// get page data
https.get(options, function (res) {
  csvStream.pipe(writableStream);
  var data = '';
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
    data += chunk;
  });
  res.on('end', function () {
    var doc = new DOMParser().parseFromString(data, 'text/xml');
    var loc = doc.documentElement.getElementsByTagName('loc');
    for (var i = 0; i < loc.length; i++) {
      for (var j = 0; j < loc[i].childNodes.length; j++) {
        var page = loc[i].childNodes[j].data;
        requestQueue.push(page);
      } 
    }
    for (var i = 0; i < 20; i++) {
      getNextURL();
    }
  });
}).on('error', function (e) {
  console.error(e);
});

function getStatus (page) {
  https.get(page, function (res) {
    console.log(page);
    console.log('Got response ' + res.statusCode);
    if (res.statusCode !== 200) {
      csvStream.write([page, res.statusCode]);
    }
    console.log('________________________');
    res.resume();
    res.on('end', function() {
      getNextURL();
      });
  }).on('error', function (e) {
    console.log('Got error ' + e.message);
    getNextURL();
    csvStream.end();
  });
}

function getNextURL() {
  if (requestQueue.length === 0) return;
  var next = requestQueue.pop();
  var last = next.length;
  var thirdlast = next.length - 3;
  var endURL = next.substring(thirdlast, last);
  if (endURL === 'xml') {
    getSitemap(next);
  } else {
    getStatus(next);
  }
}

function getSitemap(page) {
  https.get(page, function (res) {
    csvStream.pipe(writableStream);
    var data = '';
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function () {
      var doc = new DOMParser().parseFromString(data, 'text/xml');
      var loc = doc.documentElement.getElementsByTagName('loc');
      for (var i = 0; i < loc.length; i++) {
        for (var j = 0; j < loc[i].childNodes.length; j++) {
          var page = loc[i].childNodes[j].data;
          requestQueue.push(page);
        } 
      }
        getNextURL();
    });
  }).on('error', function (e) {
    console.error(e);
  });
}


