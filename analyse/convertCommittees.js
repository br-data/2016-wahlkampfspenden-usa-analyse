var fs = require('fs');
var json2csv = require('json2csv');

loadJSON('./json/committees.json', transformJSON);

function transformJSON(json) {

  var result = [];

  for (var committee in json) {

    result.push({

      id: json[committee].thomas_id,
      name: json[committee].name,
      type: json[committee].type,
    });

    for (var sub in json[committee].subcommittees) {

      result.push({

        id: json[committee].thomas_id + json[committee].subcommittees[sub].thomas_id,
        name: json[committee].subcommittees[sub].name,
        type: json[committee].subcommittees[sub].type || json[committee].type,
      });
    }

  }

  saveCSV(result, ['id', 'name', 'type'], './csv/committees.csv');
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
