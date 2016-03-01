var fs = require('fs');
var json2csv = require('json2csv');

loadJSON('./json/committee-members.json', transformJSON);

function transformJSON(json) {

  var result = [];

  for (var committee in json) {

    for (var member in json[committee]) {

      result.push({

        id: json[committee][member].bioguide,
        name: json[committee][member].name,
        party: json[committee][member].party,
        rank: json[committee][member].rank,
        title: json[committee][member].title || 'Member',
        committee: committee
      });
    }
  }

  saveCSV(result, ['id', 'name', 'party', 'rank', 'title', 'committee'], './csv/committee-members.csv');
}

function loadJSON(filename, callback) {

  fs.readFile(filename, function (error, data) {

    if (!error) {

      console.log('File loaded:', filename);

      callback(JSON.parse(data));
    } else {

      console.log(error);
    }
  });
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
