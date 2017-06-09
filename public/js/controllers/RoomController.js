class RoomController {
	constructor(roomId,callback) {
		INITIAL_CAMERA = 210;
		CAMERA = new THREE.PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 1000);

		document.querySelector('#canvas-container').innerHTML = "";
		document.querySelector('#canvas-container').appendChild(RENDERER.domElement);

		this.id = roomId;
		this.setCamera();
		Transition.roomNav.show();

		var _that = this;

		var room = Ajax.get('/api/room/' + roomId + '/interactions', function(data) {

			if(data == 500) {
				USER.leave(function() {
					USER.enter('map');
				});
				return;
			}

			data = JSON.parse(data);

			if(data.room.length == 0 || data.interactions == 0) {
				USER.leave(function() {
					USER.enter('map');
				});
				return;
			}

			_that.ThreeEntity = new RoomTHREE(data);


			var interactions = data.interactions;

			var interactionNotFinished = 0;
			for(var e=0;e<interactions.length;e++) {
				if(interactions[e].is_finish == false) interactionNotFinished++;
			}

			if(interactionNotFinished == 0) {
				socket.emit('get:room:participation',{room:roomId});
			}

			if(isFunction(callback)) {
				callback();
			}
		});

		return this;

	}

	render() {

		if (!this.ThreeEntity) return

		this.ThreeEntity.update()
	}

	roomRaycaster(mouse) {
		if(!notNull(APP.ThreeEntity.interactions)) return false;

		var childrens = [];

		// forming three chilrens
		for (var i = 0; i < APP.ThreeEntity.interactions.length; i++) {
			childrens.push(APP.ThreeEntity.interactions[i].mesh)
		}

		RAY = new THREE.Raycaster(CAMERA.position, mouse.sub(CAMERA.position).normalize());
		var intersects = RAY.intersectObjects(childrens,true);

		if (intersects.length > 0) {
			for (var i = 0; i < intersects.length; i++) {
				for (var a = 0; a < childrens.length; a++) {
					if(childrens[a].uuid ==  intersects[i].object.parent.uuid) {
						return APP.ThreeEntity.interactions[a];
					}
				}
			}
		}

	}

	setCamera() {
		RENDERER.setSize(window.innerWidth, window.innerHeight);
		CAMERA.position.z = INITIAL_CAMERA;
		CAMERA.position.x = -10;
		CAMERA.position.y = 130;
		CAMERA.lookAt({x: 0, y: 70, z: 0})

	}
}
