var fs = require('fs');
var json2csv = require('json2csv');
var fuzzy = require('fuzzy');

var donations = JSON.parse(fs.readFileSync('./json/donations-2016.json'));
var committees = JSON.parse(fs.readFileSync('./json/committees-flat.json'));
var committeeMembers = JSON.parse(fs.readFileSync('./json/committee-members-flat.json'));

analyse();

function analyse() {

  var result = [];

  for (var recipient in donations) {

    var name = donations[recipient].delegate;
    var reverseName = name.split(', ').reverse().join(' ');
    var matches = fuzzySearch(reverseName, committeeMembers);

    for (var committee in matches) {

      var committeeID = matches[committee].original.committee;

      result.push({

        'delegate': donations[recipient].delegate,
        'delegate-matched': matches[committee].original.name,
        'state': donations[recipient].state,
        'party': donations[recipient].party,
        'value': donations[recipient].value,
        'type': donations[recipient].type,
        'pac': donations[recipient].pac,

        'committee-id': committeeID,
        'committee': getObject('tid', committeeID, committees).name,
        'title': matches[committee].original.title,
        'rank': matches[committee].original.rank,
        'score': matches[committee].score,
      });
    }
  }

  saveCSV(result, ['delegate', 'delegate-matched', 'type', 'state', 'party', 'value', 'pac', 'committee-id', 'committee', 'title', 'rank', 'score'], './csv/relations-2016.csv');
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
