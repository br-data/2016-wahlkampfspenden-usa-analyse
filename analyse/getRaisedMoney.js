var fs = require('fs');
var request = require('request');
var json2csv = require('json2csv');

var representatives = JSON.parse(fs.readFileSync('./json/representatives-2014.json'));
var result = [];

// Steffen Key: b247c7a367e27f22c669dc86452b2a41
// Olis Key: 4692b7eac7e14d420616ad2e7550f185
// Manus Key: 3244df62d376b324bba75fffdd92de2d
// Roberts Key: 279e26252a80e418d11fa9afae76c9c1

getData(0);

function getData(index) {

  if (index < representatives.length) {

      var currentId = representatives[index]['crp-id'];

      request('http://www.opensecrets.org/api/?method=candSummary&cid=' + currentId + '&cycle=2014&output=json&apikey=279e26252a80e418d11fa9afae76c9c1', function (error, response, data) {

        if (!error && response.statusCode == 200) {

          data = JSON.parse(data);
          data = data.response.summary['@attributes'];

          result.push({
            'crp-id': data['cid'],
            'delegate': data['cand_name'],
            'year': data['cycle'],
            'raised': data['total'],
            'spent': data['spent'],
            'cash': data['cash_on_hand'],
            'debt': data['debt']
          });

          console.log('Got data for', data['cand_name']);

          getData(++index);
        } else {

          console.log(JSON.stringify(result));
          saveJSON(JSON.stringify(result), './json/raised-2014.json');
        }
      });
  } else {

    console.log(JSON.stringify(result));
    saveJSON(JSON.stringify(result), './json//raised-2014.json');
  }
}

function getTimestamp() {

  return Math.floor(Date.now() / 1000);
}

function saveJSON(json, filename) {

    fs.writeFile(filename, json, function (error) {

        if (!error) {

            console.log('File saved:', filename);
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
