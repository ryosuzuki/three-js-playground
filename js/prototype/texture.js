var points = [];
var faces = [];
var limit = 0.15;
var num = 100;

var texture;

function addTexture () {
  if (!texture) scene.remove(texture);
  var geometry = new THREE.Geometry();
  for (var i=0; i<selectIndex.length; i++) {
    var index = selectIndex[i];
    var face = window.geometry.faces[index];
    var v1 = window.geometry.vertices[face.a];
    var v2 = window.geometry.vertices[face.b];
    var v3 = window.geometry.vertices[face.c];
    var g = new THREE.Geometry();
    g.vertices.push(v1);
    g.vertices.push(v2);
    g.vertices.push(v3);
    g.faces.push(new THREE.Face3(0, 1, 2));
    g.verticesNeedUpdate = true;
    var m = new THREE.Mesh(g)
    geometry.mergeMesh(m);

    var a = uniq[map[face.a]];
    var b = uniq[map[face.b]];
    var c = uniq[map[face.c]];
    geometry.faceVertexUvs[0].push([a.uv, b.uv, c.uv]);
    geometry.uvsNeedUpdate = true;
  }
  var rot = mesh.rotation;
  var pos = mesh.position;
  var axis = new THREE.Vector3(0, 1, 0);
  var quaternion = new THREE.Quaternion().setFromUnitVectors(axis, normal)
  var matrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);

  var image = THREE.ImageUtils.loadTexture('/assets/checkerboard.jpg');
  image.wrapS = THREE.RepeatWrapping;
  image.wrapT = THREE.RepeatWrapping;
  image.repeat.set(4, 4);

  var material = new THREE.MeshBasicMaterial({ map: image });
  texture = new THREE.Mesh(geometry, material);
  texture.castShadow = true;
  texture.receiveShadow = true;
  texture.rotation.set(rot.x, rot.y, rot.z, rot.order)
  texture.castShadow = true;
  texture.receiveShadow = true;
  texture.position.set(pos.x, pos.y, pos.z);
  scene.add(texture);
}

function computeTexture () {
  faces = geometry.faces.filter( function (face, index) {
    var a = uniq[map[face.a]];
    var b = uniq[map[face.b]];
    var c = uniq[map[face.c]];
    return selectIndex.includes(index);
    /*
    if (a.uv && b.uv && c.uv) {
      if (a.u==b.u && b.u==c.u) return false;
      if (a.v==b.v && b.v==c.v) return false;
      if (a.u>0.5+limit||a.v>0.5+limit) return false;
      if (b.u>0.5+limit||b.v>0.5+limit) return false;
      if (c.u>0.5+limit||c.v>0.5+limit) return false;
      if (a.u<0.5-limit||a.v<0.5-limit) return false;
      if (b.u<0.5-limit||b.v<0.5-limit) return false;
      if (c.u<0.5-limit||c.v<0.5-limit) return false;
      return true;
    } else {
      return false;
    }
    */
  })
  points = [];
  for (var k=0; k<faces.length; k++) {
    var face = faces[k];
    for (var i=0; i<num; i++) {
      for (var j=0; j<num; j++) {
        var point = { u: (1/num)*i, v: (1/num)*j }
        var a = uniq[map[face.a]];
        var b = uniq[map[face.b]];
        var c = uniq[map[face.c]];
        if (!checkInTriangle(point, a, b, c)) continue;
        var A = [[a.u-c.u, b.u-c.u], [a.v-c.v, b.v-c.v]];
        var B = [point.u-c.u, point.v-c.v];
        var M = numeric.solve(A, B);
        point.x = M[0]*a.vertex.x + M[1]*b.vertex.x + (1-M[0]-M[1])*c.vertex.x;
        point.y = M[0]*a.vertex.y + M[1]*b.vertex.y + (1-M[0]-M[1])*c.vertex.y;
        point.z = M[0]*a.vertex.z + M[1]*b.vertex.z + (1-M[0]-M[1])*c.vertex.z;
        point.pos = new THREE.Vector3(point.x, point.y, point.z);
        point.face = face;
        point.normal = face.normal;
        console.log(point);
        points.push(point);
        addGeometricTexture(point);
      }
    }
  }
}

function checkInTriangle (p, a, b, c) {
  function sign (p1, p2, p3) {
    return (p1.u-p3.u)*(p2.v-p3.v) - (p2.u-p3.u)*(p1.v-p3.v);
  }
  var b1 = sign(p, a, b) < 0;
  var b2 = sign(p, b, c) < 0;
  var b3 = sign(p, c, a) < 0;
  return ((b1==b2) && (b2==b3));
}

function addGeometricTexture (point) {
  var v1 = window.geometry.vertices[point.face.a];
  var v2 = window.geometry.vertices[point.face.b];
  var v3 = window.geometry.vertices[point.face.c];
  var pos = mesh.position;
  var n = point.face.normal.normalize();

  var geometry = new THREE.Geometry();
  geometry.vertices.push(v1);
  geometry.vertices.push(v2);
  geometry.vertices.push(v3);
  geometry.faces.push(new THREE.Face3(0, 1, 2));
  geometry.verticesNeedUpdate = true;

  var rot = mesh.rotation;
  var axis = new THREE.Vector3(0, 1, 0);
  var quaternion = new THREE.Quaternion().setFromUnitVectors(axis, normal)
  var matrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);

  var radius = size/40;
  var height = size/10;
  var tetra = new THREE.Mesh(
    new THREE.CylinderGeometry(0, radius, height, 8, 1),
    new THREE.MeshLambertMaterial({color: 0x0000ff})
  )
  tetra.applyMatrix(matrix);
  tetra.castShadow = true;
  tetra.receiveShadow = true;
  tetra.position.set(point.x, point.y, point.z)
  geometry.mergeMesh(tetra);

  var texture = new THREE.Mesh(
    geometry, new THREE.MeshBasicMaterial({color: 'yellow'}));
  texture.rotation.set(rot.x, rot.y, rot.z, rot.order)
  texture.castShadow = true;
  texture.receiveShadow = true;
  texture.position.set(pos.x, pos.y, pos.z);
  scene.add(texture);
  return texture;
}