var fs = require('fs');
var json2csv = require('json2csv');
var fuzzy = require('fuzzy');

var representatives = JSON.parse(fs.readFileSync('./json/representatives.json'));
var committees = JSON.parse(fs.readFileSync('./json/committees-flat.json'));
var committeeMembers = JSON.parse(fs.readFileSync('./json/committee-members-flat.json'));

analyse();

function analyse() {

  var result = [];

  for (var current in representatives) {

    var name = representatives[current].delegate;

    console.log(name);
    var reverseName = name.split(', ').reverse().join(' ');
    var matches = fuzzySearch(reverseName, committeeMembers);

    for (var committee in matches) {

      var committeeID = matches[committee].original.committee;

      result.push({

        'name': representatives[current].delegate,
        'name-matched': matches[committee].original.name,
        'type': representatives[current].type,
        'state': representatives[current].state,
        'party': representatives[current].party,

        'committee-id': committeeID,
        'committee': getObject('tid', committeeID, committees).name,
        'title': matches[committee].original.title,
        'rank': matches[committee].original.rank,
        'score': matches[committee].score,
      });
    }
  }

  saveCSV(result, ['name', 'name-matched', 'type', 'state', 'party', 'committee-id', 'committee', 'title', 'rank', 'score'], './csv/members.csv');
}

function fuzzySearch(string, array) {

  var results = fuzzy.filter(string, array, { extract: function(el) { return el.name; }});
  var matches = results.map(function(el) { return el; });

  return matches;
}

function getObject(key, value, arr) {

  return arr.filter(function (obj) {

    return obj[key] === value;
  })[0];
}

function saveCSV(json, fields, filename) {

  json2csv({ data: json, fields: fields }, function (error, csv) {

    if (!error) {

      fs.writeFile(filename, csv, function (error) {

        if (!error) {

          console.log('File saved:', filename);
        } else {

          console.log(error);
        }
      });
    } else {

      console.log(error);
    }
  });
}
