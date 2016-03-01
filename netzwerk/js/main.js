(function app() {
  'use strict';

  var lang = 'en';
  var currentEpisode = 10;

  var node, link, marker, text, shadow, force, drag, zoom, rect, svg;
  var nodes = {};
  var linked = {};

  var model;
  var entities;
  var relations;

  var body = d3.select('body');
  var graph = d3.select('.graph');
  var sidebar = d3.select('.sidebar');
  var close = d3.select('.close');
  var open = d3.select('.open');
  var info = d3.select('.info');
  var list = d3.select('.list');
  var slider = d3.select('.slider');
  var nav = d3.select('nav');
  var episode = d3.select('.episode-content');
  var loading = d3.select('.loading');

  var isDragging = false;
  var isMobile = isMobileBrowser();

  var timeout;

  var width = parseInt(graph.style('width')),
      height = parseInt(graph.style('height'));

  // Load data from JSON and initialize the app
  d3.json('data/data.json', function(error, data) {
    if (error) {
      console.log(error);
    } else {
      model = data;

      sortData();
      drawGraph();
      registerEventListeners();
      nav.style('visibility', 'visible');
    }
  });

  function registerEventListeners() {

    // Update graph on slider events
    slider.on('change', episodeChanged)
          .on('input', changingEpisode);

    close.on('click', function () {
      body.classed({'with-menu': false});
      nav.style('padding-left', '0');
      sidebar.style('left', '-320px');
      open.style('left', '40px');
    });

    open.on('click', function () {
      body.classed({'with-menu': true});
      nav.style('padding-left', '320px');
      sidebar.style('left', '0');
      open.style('left', '-100px');
    });

    d3.selectAll('div[data-zoom]').on('click', function () {

      setTranslationCenter(this.dataset.zoom);
      zoomed();
    });

    // Redraw on resize end
    // https://css-tricks.com/snippets/jquery/done-resizing-event/
/*    d3.select(window).on('resize', function() {
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        width = parseInt(graph.style('width'));
        height = parseInt(graph.style('height'));

        resetGraph();
        sortData();
        drawGraph();
      }, 500);
    });*/
  }

  function sortData() {
    relations = model.relations;
    entities = model.entities;

    // Sort relations by source, then target. Speeds up inital drawing.
    relations.sort(function (a, b) {
      if (a.source > b.source) {return 1;}
      else if (a.source < b.source) {return -1;}
      else {
        if (a.target > b.target) {return 1;}
        if (a.target < b.target) {return -1;}
        else {return 0;}
      }
    });

    // Compute the distinct nodes from the links.
    // http://bl.ocks.org/mbostock/1153292
    relations.forEach(function (relation, i) {


      // Any relations with duplicate source and target get an incremented 'linknum'
      if (i !== 0 &&
        relation.source === relations[i-1].source &&
        relation.target === relations[i-1].target) {
            relation.linknum = relations[i-1].linknum + 1;
      } else {
        relation.linknum = 1;
      }

      // Compute the distinct nodes from the relations
      if (nodes[relation.source]) {
        relation.source = nodes[relation.source];
      } else {
        nodes[relation.source] = {id: relation.source};
        relation.source = nodes[relation.source];
      }

      if (nodes[relation.target]) {
        relation.target = nodes[relation.target];
      } else {
        nodes[relation.target] = {id: relation.target};
        relation.target = nodes[relation.target];
      }

      // Add relation source and target information
      relation.source.info = getObject('id', relation.source.id, entities);
      relation.target.info = getObject('id', relation.target.id, entities);

      linked[relation.source.id + ',' + relation.target.id] = true;
    });
  }

  function drawGraph() {
    force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(relations)
        .size([width * 1.3, height])
        .gravity(0.1)
        .linkDistance(150)
        .charge(-500)
        .on('tick', tick)
        .start();

    zoom = d3.behavior.zoom()
        .scaleExtent([0.4, 2])
        .on('zoom', zoomed);

    svg = graph.append('svg:svg')
        .attr('width', width)
        .attr('height', height)
        .attr('pointer-events', 'all')
      .append('svg:g')
        .call(zoom)
      .append('svg:g');

    // Necessary for paning and zooming
    // http://bl.ocks.org/mbostock/6123708
    rect = svg.append('svg:rect')
        .attr('width', width*2)
        .attr('height', height*2)
        .attr('x', width/2 - width)
        .attr('y', height/2 - height)
        .attr('fill', '#fcfcfc')
        .attr('fill-opacity', '0');

    drag = d3.behavior.drag()
      .origin(function (d) { return d; })
      .on('dragstart', dragstart)
      .on('drag', dragging)
      .on('dragend', dragend);

    link = svg.append('svg:g').selectAll('path')
        .data(force.links())
      .enter().append('svg:path')
        .attr('class', function (d) { return 'link ' + d.type; })
        .style('opacity', 0.25);

    node = svg.selectAll('.node')
        .data(force.nodes())
      .enter().append('g')
        .attr('class', 'node')
        .style('opacity', 1)
        .on('mouseover', function (d) {
          connectedNodes(d);
          displayInfo(d);
          displayRelations(d, relations);
        })
        .on('mouseout', function (d) {
          connectedNodes(null);
        })
      .call(drag);

    marker = node.append('svg:circle')
        .attr('class', function (d) {
          if (d.info) {
            return d.info.type;
          } else {

          }
        })
        .attr('r', function (d) {
          return (d.weight - 2) * 0.1 + 7;
        });

    shadow = node.append('svg:text')
        .attr('x', 14)
        .attr('y', '.35em')
        .attr('class', 'shadow')
        .text(function (d) { return d.id; });

    text = node.append('svg:text')
        .attr('x', 14)
        .attr('y', '.4em')
        .text(function (d) { return d.id; });


    // Static force layout for mobile devices
    // http://bl.ocks.org/mbostock/1667139
    if (true || isMobile) {
      loading.style('opacity', '1');

      setTimeout(function() {
        force.start();

        for (var i = 100; i > 0; --i) {
          force.tick(true);
        }

        force.stop();
        loading.style('opacity', '0');
      }, 10);
    }
  }

  function zoomed() {
    svg.attr('transform',
        'translate(' + zoom.translate() + ')' +
        ' scale(' + zoom.scale() + ')');
  }

  // Calculate scale and translated center
  // http://bl.ocks.org/linssen/7352810
  function setTranslationCenter(factor) {
      var direction = 1,
        targetZoom = 1,
        center = [width / 2, height / 2],
        extent = zoom.scaleExtent(),
        translate = zoom.translate(),
        translate0 = [],
        l = [],
        view = { x: translate[0], y: translate[1], k: zoom.scale() };

      d3.event.preventDefault();
      targetZoom = zoom.scale() * (1 + factor * direction);

      if (targetZoom < extent[0] || targetZoom > extent[1]) {
        return false;
      }

      translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
      view.k = targetZoom;
      l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];
      view.x += center[0] - l[0];
      view.y += center[1] - l[1];

      zoom.scale(view.k).translate([view.x, view.y]);
  }

  function tick(enforce) {
    if (enforce || !isMobile) {
      var q = d3.geom.quadtree(nodes),
          i = 0,
          n = nodes.length;

      while (++i < n) {
        q.visit(collide(nodes[i]));
      }

      link.attr('d', drawLinks);
      node.attr('transform', drawNode);
    }
  }

  function resetGraph() {
    d3.select('svg').remove();
    node = {};
    link = [];
    linked = [];

    //@TODO Rather remove single nodes manually
    nodes = {};
    entities = [];
    relations = [];
  }

  function episodeChanged() {
    setEpisode(this.value);
    resetGraph();
    sortData();
    drawGraph();

    if(!isMobile) {
      force.start();
      d3.timer(force.resume);
    }
  }

  function changingEpisode() {
    setEpisode(this.value);
  }

  // Use elliptical arc path segments to doubly-encode directionality.
  function drawLinks(d) {
    var dx = d.target.x - d.source.x,
        dy = d.target.y - d.source.y,
        dr = Math.sqrt(dx * dx + dy * dy);

    return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr * d.linknum + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
  }

  function drawNode(d) {
    return 'translate(' + d.x + ',' + d.y + ')';
  }

  // Highlight neighbouring nodes an related links
  // http://bl.ocks.org/mbostock/4062006
  function connectedNodes(d) {
    if (!isDragging) {
      if (d !== null) {

        node.style('opacity', function (o) {
          // Highlight connected nodes
          return d.id === o.id | neighboring(d, o)  ? 1 : 0.1;
        });
        link.style('opacity', function (o) {
          // Highlight outgoing relations
          return d.id === o.source.id ? 1 : 0.05;
        });
      } else {
        node.style('opacity', 1);
        link.style('opacity', 0.25);
      }
    }
  }

  function dragstart(d) {
    isDragging = true;
    d3.event.sourceEvent.stopPropagation();

    d3.select(this)
      .classed('dragging', true);
    force.stop();
  }

  function dragging(d) {
    d3.select(this)
      .attr('cx', d.x = d3.event.x)
      .attr('cy', d.y = d3.event.y);

    tick();
  }

  function dragend(d) {
    isDragging = false;
    d3.select(this)
      .classed('dragging', false);

    tick();

    if (!isMobile) {
      force.resume();
    }

    connectedNodes(d);
  }

  // Collision detection
  // http://bl.ocks.org/mbostock/3231298
  function collide(node) {
    var r = node.radius + 30,
        nx1 = node.x - r,
        nx2 = node.x + r,
        ny1 = node.y - r,
        ny2 = node.y + r;
    return function(quad, x1, y1, x2, y2) {
      if (quad.point && (quad.point !== node)) {
        var x = node.x - quad.point.x,
            y = node.y - quad.point.y,
            l = Math.sqrt(x * x + y * y),
            r = node.radius + quad.point.radius;
        if (l < r) {
          l = (l - r) / l * 0.5;
          node.x -= x *= l;
          node.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
  }

  function displayInfo(d) {
    if (!isDragging ) {

      if (d.info) {
         info.html(
          '<h2>' + d.info.name + '</h2>' +
          (d.info.party ? ('<p>' + d.info.state + ', ' + d.info.party + '</p>') : '')
        );
      }
    }
  }

  function displayRelations(d) {
    if (!isDragging) {
      var str = '';
      var rels = relations.filter(function (rel) {
        return rel.source.id === d.id;
        //return rel.source.id == d.id && convertToNumber(rel.start) <= currentEpisode;
      });
      for (var i = 0; i < rels.length; i++) {
        str +=  '<p>' +
          '<span class="' + (rels[i].target ? rels[i].target.info.type : '') + '">' +
          rels[i].target.id + ' (' + rels[i].value + ')' +
          '</span> <span class="' + rels[i].type + '"></span>' +
          '</p>';
      }
      list.html(str);
    }
  }

  // Converts epsiode s01e10 to integer 19
  function convertToNumber(episode) {
    if (!episode) { return false; }
    var arr = episode.toString().split('e');
    return parseInt(arr[0].replace('s','') + (arr[1] - 1));
  }

  // Converts integer 19 to epsiode s01e10
  function convertToString(number) {
    var arr = number.toString().split('');
    return 's' + toFixed(arr[0]) + 'e' + toFixed((parseInt(arr[1]) + 1));
  }

  function getEpisodeFromURL() {
    if (location.hash) {
      var hashEpisode =
        convertToNumber(location.hash.replace('#', '').split('?')[0]) || 10;
      currentEpisode = hashEpisode;
      slider.property('value', hashEpisode || 10);
      episode.text(convertToString(hashEpisode));
    }
  }

  function setEpisode(value) {
    currentEpisode = convertToNumber(value);
    location.hash = convertToString(currentEpisode);
    episode.text(convertToString(currentEpisode));
  }

  function toFixed(n){
      return n > 9 ? '' + n: '0' + n;
  }

  function toDashCase(str) {
    return str.replace(/\s+/g, '-').toLowerCase();
  }

  function getObject(key, value, arr) {
    return arr.filter(function (obj) {
      return obj[key] == value;
    })[0];
  }

  function getElementsByAttribute(attr) {
    return document.querySelectorAll('[' + attr + ']');
  }

  function neighboring(a, b) {
    return linked[a.id + ',' + b.id];
  }

  // http://stackoverflow.com/a/3540295/2037629
  function isMobileBrowser() {
    return (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4)));
  }
})();
