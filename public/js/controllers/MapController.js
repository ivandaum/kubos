var MapController = function () {
	SCENE = new THREE.Scene();
	RENDERER = new THREE.WebGLRenderer({antialias: true});

	INITIAL_CAMERA = 5;
	CAMERA = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
	RAY = new THREE.Raycaster();

	RENDERER.setClearColor('#000');

	document.querySelector('#canvas-container').innerHTML = "";
	document.querySelector('#canvas-container').appendChild(RENDERER.domElement);

	this.setCamera();
	this.RoomTHREE = new MapTHREE();

	return this;
};

MapController.prototype = {
	render: function() {

		if(this.RoomTHREE) {
			this.RoomTHREE.update();
		}
	},
	getMap: function () {
		var _this = this;
		Navigator.goTo('canvas-container');
		Ajax.get('/api/rooms', function (data) {
			var parsed = JSON.parse(data);
			_this.RoomTHREE.rooms = parsed.rooms;
			socket.emit('get:help_request');
		});
	},
	mapRaycaster: function(mouse) {

		var childrens = SCENE.children[0].children;

		RAY = new THREE.Raycaster( CAMERA.position, mouse.sub( CAMERA.position ).normalize() );
		var intersects = RAY.intersectObjects( childrens );

		var child = {};
		for(var a=0; a<childrens.length; a++) {

			child = childrens[a];

			if(typeof child.roomId != 'undefined') {

				this.RoomTHREE.normalMaterial(child);
			}
		}

		for(var i=0; i<intersects.length; i++) {
			child = intersects[i].object;

			if(typeof child.roomId != 'undefined') {
				this.RoomTHREE.makeRoomGlow(child);
				break;
			}
		}

	},
	setCamera: function () {
		RENDERER.setSize(window.innerWidth, window.innerHeight);

		CAMERA.position.z = INITIAL_CAMERA;
		CAMERA.position.x = 0;
		CAMERA.position.y = 0;
		CAMERA.lookAt({x: 0, y: 0, z: 0})
	}
};