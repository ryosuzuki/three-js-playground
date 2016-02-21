
'use strict';

var normals = require('normals');
var core = require('rle-core');
var repair = require('rle-repair');
var extents = require('rle-extents')


var spatialGrid = require('./spatial-grid');
var signedDistance = require('./signed-distance');

var voxelCompare = new Function('a', 'b', [
  'for(var i=2; i>=0; --i) {',
    'var d = a[i]-b[i];',
    'if(d) return d;',
  '}',
  'return 0;'
].join('\n'));

function rasterize(cells, positions, mappings, faceNormals) {
  if(cells.cells) {
    faceNormals = cells.faceNormals;
    positions = cells.positions;
    cells = cells.cells
  }
  var grid = spatialGrid(cells, positions, 1.0);
  var faceNormals = faceNormals || normals.faceNormals(grid.cells, grid.positions);
  var result = [];
  var n = 0;
  console.log('hoge')
  for(var id in grid.grid) {
    var coord = grid.grid[id].coord;
    var d = signedDistance(grid, faceNormals, coord);
    if(isNaN(d) || Math.abs(d) > 1.0) {
      // var m = mapping(cells, grid, coord, positions, mappings);
      // if (m) {
      //   result.push([coord[0], coord[1], coord[2], 1,  d, [], faceNormals]);
      // } else {
        continue;
      // }
    } else {
      var m = mapping(cells, grid, coord, positions, mappings);
      if(d < 0 && !m) {
      // if(d < 0) {
        result.push([coord[0], coord[1], coord[2], 1, -d, [], faceNormals]);
      } else {
        result.push([coord[0], coord[1], coord[2], 0,  d, [], faceNormals]);
      }
    }
  }

  result.sort(voxelCompare);
  var X = new Array(result.length+1);
  var Y = new Array(result.length+1);
  var Z = new Array(result.length+1);
  var P = new Array(result.length+1);
  var D = new Array(result.length+1);
  var V = new Array(result.length+1);
  var M = new Array(result.length+1);
  X[0] = Y[0] = Z[0] = core.NEGATIVE_INFINITY;
  P[0] = 0;
  D[0] = 1.0;
  for(var i=0; i<result.length; ++i) {
    var r = result[i];
    X[i+1] = r[0];
    Y[i+1] = r[1];
    Z[i+1] = r[2];
    P[i+1] = r[3];
    D[i+1] = r[4];
    V[i+1] = r[5];
    M[i+1] = r[6];
  }

  // return repair.removeDuplicates(new core.DynamicVolume([X,Y,Z], D, P));
  var volume = repair.removeDuplicates(new core.DynamicVolume([X,Y,Z], D, P));
  volume.vertices = V;
  volume.mappings = M;
  return volume;
}

function mapping (cells, grid, coord, positions, mappings) {
  var cs = grid.closestCells(coord).cells;
  var c = cs[0];
  var vertices = cells[c];
  var va = positions[vertices[0]];
  var vb = positions[vertices[1]];
  var vc = positions[vertices[2]];
  va = va.map(function (pos) { return pos / grid.tolerance });
  vb = vb.map(function (pos) { return pos / grid.tolerance });
  vc = vc.map(function (pos) { return pos / grid.tolerance });
  var A = [
    [ va[0], vb[0], vc[0] ],
    [ va[1], vb[1], vc[1] ],
    [ va[2], vb[2], vc[2] ]
  ];
  var Ainv = numeric.inv(A);
  var t = numeric.dot(Ainv, coord);
  var alpha = t[0]+t[1]+t[2]-1;
  t = t.map(function (i) { return i-(alpha/3); })
  var a = t[0];
  var b = t[1];
  var c = t[2];
  // u = a*va.u + b*vb.u + c*vc.u;
  // v = a*va.v + b*vb.v + c*vc.v;
  if (mappings && mappings.length > 0) {
    var ma = mappings[vertices[0]];
    var mb = mappings[vertices[1]];
    var mc = mappings[vertices[2]];
    var u = a*ma[0] + b*mb[0] + c*mc[0];
    var v = a*ma[1] + b*mb[1] + c*mc[1]
    var mapping = [u, v];
    var remove = false;
    console.log({u: u, v: v})
    var stripe = 0.02;
    if (!isNaN(v)) {
      for (var i=-150; i<150; i++) {
        if (i%2 == 0) continue;
        var l = stripe*i;
        var h = stripe*(i+1);
        if (l < v && v < h) return true;
      }
    }
  }
  return false;
}


module.exports = rasterize;