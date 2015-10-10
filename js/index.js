
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
var plane;
var gridHelper;
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
var scale = 100;
var size = scale;
var boxBody;
var groundBody;
var boxBody;
var cylinderBody;
var selectedBody;

var demo = new CANNON.Demo();

demo.addScene('index', function () {
  var world = demo.getWorld();
  world.gravity.set(0,0,-30);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 17;

  world.defaultContactMaterial.contactEquationStiffness = 1e6;
  world.defaultContactMaterial.contactEquationRelaxation = 3;

  // ground plane
  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.Body({ mass: 0 });
  groundBody.addShape(groundShape);
  groundBody.position.set(-10,0,0);
  world.addBody(groundBody);
  demo.addVisual(groundBody);

            var sphereShape = new CANNON.Sphere(size);
            var sphereBody = new CANNON.Body({ mass: mass });
            sphereBody.addShape(sphereShape);
            sphereBody.position.set(size*2,size*2,size+1);
            world.addBody(sphereBody);
            demo.addVisual(sphereBody);


  var mass = 1;
  var boxShape = new CANNON.Box(new CANNON.Vec3(scale, scale, scale));
  var boxBody = new CANNON.Body({ mass: mass })
  boxBody.addShape(boxShape);
  boxBody.position.set(0, 3, 0);
  world.add(boxBody);
  demo.addVisual(boxBody);

  var cylinderShape = new CANNON.Cylinder(scale*3, scale*3 , scale*0.1, 100)
  var cylinderBody = new CANNON.Body({ mass: mass });
  cylinderBody.position.set(0, 3, 0)
  world.add(cylinderBody);
  demo.addVisual(cylinderBody);

  var selectedShape = new CANNON.Sphere(0.1);
  var selectedBody = new CANNON.Body({ mass: 0 });
  selectedBody.addShape(selectedShape);
  selectedBody.collisionFilterGroup = 0;
  selectedBody.collisionFilterMask = 0;
  world.add(selectedBody)
  demo.addVisual(selectedBody);
});

demo.start();



function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(scale*5, scale*5, scale*5)
  scene.add( camera );

  scene.add(new THREE.AmbientLight(0xf0f0f0));
  var light = new THREE.SpotLight(0xffffff, 1.5);
  light.position.set(0, scale*7.5, scale);
  light.castShadow = true;
  light.shadowCameraNear = scale;
  light.shadowCameraFar = camera.far;
  light.shadowCameraFov = 70;
  light.shadowBias = -0.000222;
  light.shadowDarkness = 0.25;
  light.shadowMapWidth = 1024;
  light.shadowMapHeight = 1024;
  scene.add(light);
  spotlight = light;

  gridHelper = new THREE.GridHelper(scale*5, scale/2);
  gridHelper.position.y = 0.01;
  gridHelper.material.opacity = 0.25;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);

  var planeGeometry = new THREE.PlaneGeometry(scale*10, scale*10, 20, 20);
  planeGeometry.rotateX( - Math.PI / 2 );
  var planeMaterial = new THREE.MeshBasicMaterial( { color: 0xeeeeee } );
  plane = new THREE.Mesh( planeGeometry, planeMaterial );
  plane.receiveShadow = true;
  scene.add( plane );

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

  mouse2D = new THREE.Vector3(0, 10000, 0.5);
  projector = new THREE.Projector();
  tmpVec = new THREE.Vector3();
}

function initCannon () {
  world.gravity.set(0, -10, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;
  world.step(timeStep);

  var groundShape = new CANNON.Plane();
  groundBody = new CANNON.Body({ mass: 0 })
  groundBody.addShape(groundShape);
  groundBody.position = new CANNON.Vec3(0, 0, 0)
  groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(scale, 0, 0),-Math.PI/2);
  // groundBody.position.y = 0;
  world.add(groundBody)
  plane.position.copy(groundBody.position)
  gridHelper.position.copy(groundBody.position)

  var mass = scale;
  var boxShape = new CANNON.Box(new CANNON.Vec3(size, size, size));
  boxBody = new CANNON.Body({ mass: mass })
  boxBody.addShape(boxShape);
  boxBody.position.set(0, 3, 0);
  world.add(boxBody);

  var cylinderShape = new CANNON.Cylinder(scale*3, scale*3 , scale*0.1, 100)
  cylinderBody = new CANNON.Body({ mass: mass });
  cylinderBody.position.set(0, 3, 0)
  world.add(cylinderBody);

  var selectedShape = new CANNON.Sphere(0.1);
  selectedBody = new CANNON.Body({ mass: 0 });
  selectedBody.addShape(selectedShape);
  selectedBody.collisionFilterGroup = 0;
  selectedBody.collisionFilterMask = 0;
  world.add(selectedBody)
}


function drawObjects() {
  var boxGeometry = new THREE.BoxGeometry(scale, scale, scale);
  var boxMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  box = new THREE.Mesh(boxGeometry, boxMaterial);
  box.castShadow = true;
  box.receiveShadow = true;
  scene.add(box);
  objects.push(box);

  var cylinderGeometry = new THREE.CylinderGeometry(scale*3, scale*3 , scale*0.1, 100);
  var cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0x00aa00 });
  cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
  scene.add(cylinder);
}

function dragObjects() {
  var dragcontrols = new THREE.DragControls(camera, objects, renderer.domElement);
  dragcontrols.on('hoveron', function (event) {
    hover = true;
  })
  dragcontrols.on('hoveroff', function (event) {
    if (!selected) hover = false;
  })

  document.addEventListener('mousedown', onDocumentMouseDown, false);
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  document.addEventListener('mouseup', onDocumentMouseUp, false);
}

function onDocumentMouseDown (event) {
  if (!hover) return false;
  draggable = true;
  controls.enabled = false;

  var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  vector = new THREE.Vector3(mouseX, mouseY, 1);
  vector.unproject(camera);
  dir = vector.sub(camera.position).normalize()
  raycaster.set(camera.position, dir);
  var intersects = raycaster.intersectObjects(objects);
  if (intersects.length > 0) {
    selected = intersects[0];
  }
}

function onDocumentMouseMove (event) {
  if (!selected) return false;
  event.preventDefault();

  var mouseX = (event.clientX / window.innerWidth) * 2 - 1;
  var mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  vector = new THREE.Vector3(mouseX, mouseY, 1);
  vector.unproject(camera);
  dir = vector.sub(camera.position).normalize()
  raycaster.set(camera.position, dir);
  var point = raycaster.ray.intersectPlane(new THREE.Plane(plane.position));
  var distance = -camera.position.z / dir.z;
  pos = camera.position.clone().add(dir.multiplyScalar(distance));
  if (dimention == 'xz') {
    selectedBody.position.x = point.x;
    selectedBody.position.z = point.z;
  } else if (dimention == 'x') {
    selectedBody.position.x = point.x;
  } else if (dimention == 'y') {
    if (pos.y < 0) return false;
    selectedBody.position.y = pos.y;
  } else if (dimention == 'z') {
    selectedBody.position.z = point.z;
  }
}

function onDocumentMouseUp (event) {
  controls.enabled = true;
  hover = false;
  selected = undefined;
}

var lastCallTime = 0;
var maxSubSteps = 3;
function updatePhysics(){
  var now = Date.now() / 1000;
  if(!lastCallTime){
    world.step(timeStep);
    lastCallTime = now;
    return;
  }
  var timeSinceLastCall = now - lastCallTime;
  world.step(timeStep, timeSinceLastCall, maxSubSteps);
  lastCallTime = now;
  if (selected) {
    box.position.copy(selectedBody.position);
    boxBody.position.copy(selectedBody.position);
  } else {
    box.position.copy(boxBody.position);
    selectedBody.position.copy(boxBody.position);
  }
  cylinder.position.copy(cylinderBody.position)
}

function animate(){
  requestAnimationFrame(animate);
  updatePhysics();
  render();
  stats.update();
}

function render() {
  controls.update();
  renderer.clear();
  renderer.render(scene, camera);
}

/*
$( function () {
  init();
  initCannon();
  drawObjects();
  dragObjects();
  animate();

  $('#init').click( function() {
    selectedBody.position.setZero();
  });
  $('#xz').click( function() {
    dimention = 'xz';
  });
  $('#x').click( function() {
    dimention = 'x';
  });
  $('#y').click( function() {
    dimention = 'y';
  });
  $('#z').click( function() {
    dimention = 'z';
  });
});
*/

