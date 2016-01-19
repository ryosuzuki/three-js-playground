
var container, stats;
var camera, scene, renderer;
var splineHelperObjects = [],
    splineOutline;
var splinePointsLength = 4;
var options;

var geometry = new THREE.BoxGeometry( 20, 20, 20 );

var ARC_SEGMENTS = 200;
var splineMesh;

var splines = {

};
var box;
var boxHelperObjects = [];

var raycaster = new THREE.Raycaster()
var mouse = new THREE.Vector2();
var lane = null
var selection = null
var offset = new THREE.Vector3()
var objects = [];
var ground;
var grid;
var hover = false;
var draggable = false;
var dragging = false;

var vector;
var dir;

var mouse2D;
var projector;
var oldPosition;
var dimention = 'xz';
var point;
var pos;
var selected;
var size = 200;

var renderStats;
var physicsStats;


var world = new CANNON.World();
var timeStep = 1.0 / 60.0;
var scale = 1;
var size = scale;
var boxBody;
var groundBody;
var boxBody;
var cylinderBody;
var selectedBody;
var bodies = [];
var meshes = [];
var draggableMeshes = [];

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(scale*2, scale*2, scale*2)
  camera.lookAt(new THREE.Vector3(0, 3, 0));
  scene.add( camera );

  scene.add(new THREE.AmbientLight(0xf0f0f0));
  var light = new THREE.SpotLight(0xffffff, 1.5);
  light.position.set(0, scale*7.5, scale);
  light.castShadow = true;
  light.shadowCameraNear = scale*3;
  light.shadowCameraFar = camera.far;
  light.shadowCameraFov = 70;
  light.shadowBias = -0.000222;
  light.shadowDarkness = 0.25;
  light.shadowMapWidth = 1024;
  light.shadowMapHeight = 1024;
  scene.add(light);
  spotlight = light;

  grid = new THREE.GridHelper(scale*5, scale/2);
  grid.position.y = 0.01;
  grid.material.opacity = 0.25;
  grid.material.transparent = true;
  scene.add(grid);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0xf0f0f0);
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMap.enabled = true;
  document.getElementById('viewport').appendChild( renderer.domElement );

  controls = new THREE.OrbitControls( camera, renderer.domElement );
  controls.damping = 0.2;
  controls.addEventListener( 'change', render );

  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '10px';
  stats.domElement.style.right = '20px';
  stats.domElement.style.zIndex = 100;
  document.getElementById('viewport').appendChild(stats.domElement);

  document.addEventListener('mousedown', onDocumentMouseDown, false);
  document.addEventListener('mousemove', onDocumentMouseDown, false);
  document.addEventListener('mouseup', onDocumentMouseUp, false);
  document.addEventListener('touchstart', onDocumentTouchStart, false);

  window.addEventListener('resize', onWindowResize, false);
}

var pinionMesh;
var rackMesh;
var geometry
var materials = [];
var basicMaterials = [];
THREE.ImageUtils.crossOrigin = '';
var texture = THREE.ImageUtils.loadTexture('/assets/plaster.jpg');
// materials[2] = material


function drawObjects () {
  geometry = new THREE.BoxGeometry(size, size, size);
  var basicMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (var i=0; i<6; i++) {
    basicMaterials.push(basicMaterial);
    materials.push(basicMaterial);
  }
  box = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial(materials));
  box.material = new THREE.MeshFaceMaterial(materials);
  // box = new THREE.Mesh(geometry, basicMaterial);

  // geometry = new THREE.BoxGeometry( size, size, size );
  // for ( var i = 0; i < geometry.faces.length; i ++ ) {
  //   geometry.faces[ i ].color.setHex( Math.random() * 0xffffff );
  // }
  // var material = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } )
  // box = new THREE.Mesh(geometry, material);

  box.geometry.verticesNeedUpdate = true
  box.material.verticesNeedUpdate = true

  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
  objects.push(box);
}


function changeMaterial (intersects, material) {
  window.current = intersects[0]
  var materialIndex = intersects[0].face.materialIndex;
  materials[materialIndex] = material;
  box.material = new THREE.MeshFaceMaterial(materials);
}

function getIntersects (event) {
  event.preventDefault();
  mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;
  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects( objects );
  return intersects
}

function onDocumentMouseMove (event) {
  console.log('move')
  var intersects = getIntersects(event);
  if (intersects.length > 0) {
    var basicMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    changeMaterial(intersects, basicMaterial);
  }
}

var changedIndex = []
var oldIndex;
var currentIndex;

function onDocumentMouseUp (event) {
  console.log('up')
  var intersects = getIntersects(event);
  if (intersects.length > 0) {
    console.log(currentIndex);
    if (changedIndex.indexOf(currentIndex) == -1) {
      var specialMaterial = new THREE.MeshPhongMaterial({
        color: 'gray',
        map: texture,
        bumpMap: texture,
        bumpScale: 0.05
      })
      materials[currentIndex] = specialMaterial;
      changedIndex.push(currentIndex);
    }
  }
}

function onDocumentMouseDown( event ) {
  console.log('down')
  var intersects = getIntersects(event)
  if ( intersects.length > 0 ) {
    window.current = intersects[0]
    currentIndex = intersects[0].face.materialIndex
    console.log(currentIndex);
    if (oldIndex != currentIndex) {
      if (changedIndex.indexOf(oldIndex) == -1) {
        materials[oldIndex] = new THREE.MeshBasicMaterial({ color: 0xffffff });
      }
      oldIndex = currentIndex;
      if (changedIndex.indexOf(currentIndex) == -1) {
        var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        materials[currentIndex] = material;
      }
    }
  }
}


function animate(){
  requestAnimationFrame(animate);
  render();
  stats.update();
}

function render() {
  controls.update();
  renderer.clear();
  renderer.render(scene, camera);
}

function onWindowResize () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentTouchStart( event ) {
  event.preventDefault();
  event.clientX = event.touches[0].clientX;
  event.clientY = event.touches[0].clientY;
  onDocumentMouseDown( event );
}


$( function () {
  init();
  drawObjects();
  // dragObjects();
  animate();

  $('#plaster').click( function() {
    texture = THREE.ImageUtils.loadTexture('/assets/plaster.jpg');
  });
  $('#map').click( function() {
    texture = THREE.ImageUtils.loadTexture('/assets/map.jpg');
  });
  $('#stone').click( function() {
    texture = THREE.ImageUtils.loadTexture('/assets/stone.jpg');
  });
});
