var body = d3.select('body');

var map = d3.select('#map');
var legend = d3.select('#legend');
var current = d3.select('#current');

// Width and height
var width = parseInt(body.style('width'));
var height = parseInt(body.style('height'));

// Define map projection
var projection = d3.geo.albersUsa()
  .translate([width/2, height/2])
  .scale([1280]);

// Define path generator
var path = d3.geo.path()
  .projection(projection);

// Define quantize scale to sort data values into buckets of color
var color = d3.scale.quantize()
  .range(colorbrewer.PuBu[8]);
  // .range(['#F1EEF6','#D4B9DA','#C994C7','#DF65B0','#E7298A','#CE1256','#91003F']);

// Create SVG element
var svg = d3.select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height);

var features = svg.append('g').attr('class', 'features');
var labels = svg.append('g').attr('class', 'labels');
var keys = legend.selectAll('li.key').attr('class', 'key');

// Load in contribution data
d3.csv('data/contribs2014.csv', function(data) {

  // Set input domain for color scale
  color.domain([
    d3.min(data, function (d) { return d['contribs-sum']; }),
    d3.max(data, function (d) { return d['contribs-sum']; })
  ]);

  // Load in GeoJSON data
  d3.json('data/usa.json', function (json) {

    // Merge the contribution data and GeoJSON
    for (var i = 0; i < data.length; i++) {

      // Grab state name
      var dataState = data[i].state;

      // Grab data value, and convert from string to float
      var dataSum = parseFloat(data[i]['contribs-sum']);
      var dataCount = parseFloat(data[i]['contribs-count']);

      // Find the corresponding state inside the GeoJSON
      for (var j = 0; j < json.features.length; j++) {

        var jsonState = json.features[j].properties.name;

        if (dataState == jsonState) {

          // Copy the data value into the JSON
          json.features[j].properties.sum = dataSum;
          json.features[j].properties.count = dataCount;

          // Stop looking through the JSON
          break;

        }
      }
    }

    // Bind data and create one path per GeoJSON feature
    features.selectAll('path').data(json.features).enter().append('path')
      .attr('class', 'feature')
      .attr('d', path)
      .style('fill', function (d) {

        var value = d.properties.sum;

        if (value) {

          return color(value);
        } else {

          return '#ccc';
        }
       })
      .on('mousemove', function (d) {

        current.html(function () {

          var str = '<p><strong>' + d.properties.name + '</strong>' +
          '<br><strong>Anzahl: </strong>' + d.properties.count +
          '<br><strong>Summe: </strong>' + d.properties.sum + ' US$</p>';

          return str;
        });
      });

    // Generate label an place them at the centroid of each feature
    labels.selectAll('.label').data(json.features).enter().append('text')
      .attr('class', 'halo')
      .attr('transform', function (d) {

          return 'translate(' + path.centroid(d) + ')';
      })
      .style('text-anchor', 'middle')
      .text(function (d) {

          return d.properties.name;
      });

    labels.selectAll('.label').data(json.features).enter().append('text')
      .attr('class', 'label')
      .attr('transform', function (d) {

          return 'translate(' + path.centroid(d) + ')';
      })
      .style('text-anchor', 'middle')
      .text(function (d) {

          return d.properties.name;
      });

    legend.append('ul')
      .attr('class', 'list-inline');

    keys.data(color.range()).enter().append('li')
      .attr('class', 'key')
      .style('border-top-color', String)
      .text(function (d) {

        var r = color.invertExtent(d);
        return Math.floor(r[0]);
      });
  });
});
