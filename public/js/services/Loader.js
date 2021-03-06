class Loader {
	constructor() {
		this.uniforms = {
			whitePath: {
				type: 'f', // a float
				value: 0
			}
		};
		this.DOM();
		this.db = {
			interactions: [],
			rooms: [],
			map: {
				rooms:0,
				finished:0,
			}
		};

		this.mesh = {
			map: {},
			rooms: {},
			interactions: {},
			mapRooms: {},
			helpButton: {},
			tubes: {},
			studio: {},
			avatar:null
		};

		this.textures = {
			interaction: null,
			room:null,
		};

		this.toLoad = {
			total:0,
			current:0
		};
		this.sentences = [
			'Relight your world',
			'Unlock obstacles',
			'Finish all rooms',
			'Work together'
		]
		this.intervalSentences = null;

		this.percent = 0;
		this.loading = null;

		var manager = new THREE.LoadingManager();
		this.OBJLoader = new THREE.OBJLoader(manager);
		this.textureLoader = new THREE.TextureLoader();
		this.size = 1.2;
	}

	DOM() {
		this.DOMloader = {
			canAnimate: false,
			canFinish: false,
			show: function() {
				var _this = this;

				if(typeof roomId == 'undefined') {
					new TweenMax.to(APP.ThreeEntity.plan.position,1,{y:INITIAL_CAMERA*3,ease:Quart.easeInOut});
				}
				new TweenMax.to('#home',1,{opacity:0, delay:0.2, ease:Quart.easeInOut, onComplete: function() {
					if(!hasClass(document.querySelector('.loader'),'active')) {
						addClass(document.querySelector('.loader'),'active')
					}
					new TweenMax.fromTo('.loader',1,{opacity:0},{opacity:1,onComplete: function() {
						_this.canAnimate = true;
					}})
				}});
			},
			hide: function() {

				document.querySelector('#app').style.opacity = 0;

				if(hasClass(document.querySelector('.loader'),'active')) {
					removeClass(document.querySelector('.loader'),'active')
				}
				this.canAnimate = false;
				this.canFinish = false;

				new TweenMax.fromTo('.loader',1,{opacity:1},{opacity:0})
				setTimeout(function() {
					document.querySelector('#app').style.opacity = 1;
				},1000);
			},
			progress: function(percent,callback) {

				if(!this.canAnimate) return;

				new TweenMax.to('.loader .progress-bar',0.5,{width: percent + '%',onComplete:function() {
					if(typeof callback == 'function') {
						callback();
					}
				}});

			}
		}

	}
	init(callback) {
		this.DOMloader.show();

		this.loadAllFromDb();
		this.loadHelpButton();
		this.loadAvatar();
		this.loadStudio();

		var _this = this;

		// Load map only at the end
		this.intervalSentences = setInterval(function() {
			let el = document.querySelector('.loader .sentence');

			new TweenMax.to(el,0.2,{opacity:0, onComplete:function() {
				if(el.innerHTML == "") {
					el.innerHTML = _this.sentences[0];
				} else {
					let next = "";
					for (var i = 0; i < _this.sentences.length; i++) {
						if(el.innerHTML == _this.sentences[i]) {
								next = notNull(_this.sentences[i+1]) ? _this.sentences[i+1] : _this.sentences[0];
								break;
						}
					}

					el.innerHTML = next;
				}
				new TweenMax.to(el,0.2,{opacity:1});
			}})
		},4000);
		this.loading = setInterval(function() {

			if(_this.percent < 30) {
				_this.DOMloader.progress(30); // fake value to prevent user thinks he's stuck
			}

			if(_this.toLoad.total <= 3) return; // because studio + button load before

			_this.percent = Math.floor(_this.toLoad.current/_this.toLoad.total * 100);

			if(_this.DOMloader.canAnimate) {
				_this.DOMloader.progress(_this.percent-30);
			}

			if(_this.toLoad.current == _this.toLoad.total) {

				clearInterval(_this.intervalSentences);
				clearInterval(_this.loading);
				_this.loadMap(function() {
					_this.percent = 100;
					var interval = setInterval(function() {
						if(_this.DOMloader.canAnimate) {
							_this.DOMloader.canFinish = true;
						}

						if(!_this.DOMloader.canFinish) return;

						clearInterval(interval);
						_this.DOMloader.progress(_this.percent, function() {
							_this.DOMloader.hide();

							if(typeof callback == 'function') {
								setTimeout(function() {
									callback();
								},1000)
							}
						});
					},300);

				});
			}
		},500);
	}

	loadTexture(callback) {
		var _this = this;

		var interaction = new Promise(resolve => {
			var img = new Image();
			img.onload = function(){

				var envMap = new THREE.Texture( img );
				envMap.mapping = THREE.SphericalReflectionMapping;
				envMap.format = THREE.RGBFormat;
				envMap.needsUpdate = true;

				resolve(envMap);
			};

			img.src = PUBLIC_PATH + 'images/metal.jpg';
		});

		var room = new Promise(resolve => {
			_this.textureLoader.load( PUBLIC_PATH + "images/stone.jpg", mapHeight => {
				mapHeight.anisotropy = 0;
				mapHeight.repeat.set( 3, 3 );
				mapHeight.offset.set( 0.001, 0.001 );
				mapHeight.wrapS = mapHeight.wrapT = THREE.RepeatWrapping;
				resolve(mapHeight);
			});
		});

		Promise.all([room,interaction]).then((values) => {
			_this.textures.room = values[0];
			_this.textures.interaction = values[1];

			if(isFunction(callback)) {
				callback();
			}
		});
	}

	getRoom(name) {
		let data = {
			db: {
				room: null,
				interactions: [],
			},
			mesh: {
				room: null,
				interactions: [],
				helpButton: null,
				tube: null,
				studio: null
			}
		};

		let objectType = null;

		for (let a = 0; a < this.db.rooms.length; a++) {
			if (this.db.rooms[a]._id == name) {
				data.db.room = this.db.rooms[a];
				data.mesh.room = this.mesh.rooms[this.db.rooms[a].object];
				objectType = this.db.rooms[a].object;
				break;
			}
		}

		for (let e = 0; e < this.db.interactions.length; e++) {

			if (this.db.interactions[e].room_id == name) {
				data.db.interactions.push(this.db.interactions[e]);

				let interactionType = this.db.interactions[e].type;
				data.mesh.interactions.push(this.mesh.interactions[interactionType]);
			}
		}

		data.mesh.studio = this.mesh.studio;
		data.mesh.helpButton = this.mesh.helpButton;

		if(objectType) {
			data.mesh.tube = this.mesh.tubes[objectType];
		}

		return data;

	}

	loadAllFromDb() {
		var _this = this;

		let rooms = new Promise(resolve => {
			Ajax.get('/api/rooms', function (data) {
				resolve(JSON.parse(data));
			});
		});

		let interactions = new Promise(resolve => {
			Ajax.get('/api/interactions', function (data) {
				resolve(JSON.parse(data));
			});
		});

		Promise.all([rooms,interactions]).then((values) => {
			_this.loadTexture(function() {
				let rooms = values[0].rooms;
				let interactions = values[1].interactions;

				// LIST OF OBJECT REQUIRED PLZ : room*2 because counting tube

				_this.toLoad.total += (rooms.length*2) + interactions.length;
				for(let ind = 0; ind < rooms.length; ind++) {
					var room = rooms[ind];
					LOADER.db.rooms[ind] = room;
					LOADER.loadRoom(room.object);
					LOADER.loadTube(room.object);
				}

				for(let ind =0; ind < interactions.length; ind++) {
					var interaction = interactions[ind];
					LOADER.db.interactions[ind] = interaction;
					LOADER.loadInteraction(interaction);
				}
			});
		});
	}
	loadTube(number) {
		var _this = this;
		var vShader = document.querySelector('#vshader');
		var fShader = document.querySelector('#fshader');

		if(notNull(_this.mesh.tubes[number])) {
			_this.toLoad.current++;
			return;
		}

		_this.mesh.tubes[number] = true;

		var shaderMaterial =
			new THREE.ShaderMaterial({
				uniforms: _this.uniforms,
				vertexShader: vShader.text,
				fragmentShader: fShader.text
			});


		new Promise(resolve => {
			_this.OBJLoader.load(PUBLIC_PATH + '/object/tubes/tube' + number + '.obj', function (mesh) {
				resolve(mesh);
			});
		})
		.then(mesh => {
			mesh.scale.set(_this.size, _this.size, _this.size);
			mesh.position.set(0, 0, 0);
			mesh.rotation.set(0, 0, 0);

			mesh.traverse(function (child) {
				if (child instanceof THREE.Mesh) {
					child.material = shaderMaterial;
				}
			});

			LOADER.mesh.tubes[number] = mesh;
			LOADER.toLoad.current++;
		});
	}
	loadStudio() {
		var _this = this;
		_this.toLoad.total++;
		new Promise(resolve => {
			_this.OBJLoader.load(PUBLIC_PATH + '/object/studio.obj', function (mesh) {
				resolve(mesh);
			});
		})
			.then(mesh => {
				mesh.scale.set(_this.size, _this.size, _this.size);
				mesh.position.set(0, 15, -150);
				mesh.rotation.set(0, 0, 0);
				mesh.traverse(function (child) {
					if (child instanceof THREE.Mesh) {
						child.material = new THREE.MeshPhongMaterial({
							opacity: 1,
							color: '#262626'
						});
					}
				});
				mesh.name = 'studio';
				LOADER.mesh.studio = mesh;
				LOADER.toLoad.current++;
			});
	}
	loadHelpButton() {
		var _this = this;
		_this.toLoad.total++;

		new Promise(resolve => {
			_this.OBJLoader.load(PUBLIC_PATH + '/object/button.obj', function (mesh) {
				resolve(mesh);
			});
		})
		.then(mesh => {
			mesh.scale.set(_this.size, _this.size, _this.size);
			mesh.position.set(0, 0, 0);
			mesh.rotation.set(0, 0, 0);
			mesh.traverse(function (child) {
				if (child instanceof THREE.Mesh) {
					if (child.name != 'bouton_on_Cylindre') {
						child.material = new THREE.MeshBasicMaterial({
							opacity: 1,
							color: '#000'
						});
					} else {
						child.material = new THREE.MeshLambertMaterial({
							opacity: 1,
							color: '#fff'
						});
					}
				}
			});
			LOADER.mesh.helpButton = mesh;
			LOADER.toLoad.current++;
		});
	}

	loadAvatar() {
		var _this = this;
		_this.toLoad.total++;

		new Promise(resolve => {
			_this.OBJLoader.load(PUBLIC_PATH + '/object/avatar.obj', function (mesh) {
				resolve(mesh);
			});
		})
		.then(mesh => {
				_this.textureLoader.load( PUBLIC_PATH + "images/avatars/map-avatar.png", mapHeight => {

					mesh.traverse(function (child) {
						if (child instanceof THREE.Mesh) {
							mapHeight.anisotropy = 0;
							mapHeight.wrapS = mapHeight.wrapT = THREE.RepeatWrapping;
							child.material = new THREE.MeshBasicMaterial({map: mapHeight});
							child.material.needsUpdate = true;
						}
					});

					mesh.rotation.x = Math.radians(180);
					LOADER.mesh.avatar = mesh;
					LOADER.toLoad.current++;
				});
		});

	}

	loadInteraction(interaction) {
		var _this = this;

		// var material = new THREE.ShaderMaterial( {
		// 	uniforms: {
		// 		tMatCap: { type: 't', value: this.textureLoader.load( PUBLIC_PATH + '/images/matball04.jpg' ) },
		// 		time: { type: 'f', value: 0 },
		// 		noise: { type: 'f', value: .0 },
		// 		useRim: { type: 'f', value: 0 },
		// 		rimPower: { type: 'f', value: 0 },
		// 		useScreen: { type: 'f', value: 0 }
		// 	},
		// 	vertexShader: document.getElementById( 'texture-vertexShader' ).textContent,
		// 	fragmentShader: document.getElementById( 'texture-fragmentShader' ).textContent,
		// 	shading: THREE.SmoothShading,
		// 	side: THREE.DoubleSide
		//
		// } );

		var material = new THREE.MeshStandardMaterial( {
			opacity: 1,
			color: 0xffffff,
			metalness: 0.9,
			roughness: 0.1,
			shading: THREE.SmoothShading,
			//envMap: this.textureLoader.load( PUBLIC_PATH + '/images/metal.jpg' )
		} );

		//material.uniforms.tMatCap.value.wrapS = material.uniforms.tMatCap.value.wrapT = THREE.ClampToEdgeWrapping;

		if(notNull(_this.mesh.interactions[interaction.type])) {
			_this.toLoad.current++;
			return;
		}
		_this.mesh.interactions[interaction.type] = true;

		new Promise(resolve => {
			_this.OBJLoader.load(PUBLIC_PATH + 'object/obstacles/' + interaction.type + '.obj', function (mesh) {
				resolve(mesh);
			});
		})
		.then(mesh => {

			mesh.originalPosition = interaction.position;
			mesh.scale.set(_this.size, _this.size, _this.size);
			mesh.position.set(interaction.position.x, interaction.position.y, interaction.position.z);
			mesh.children[0].dbObject = mesh.dbObject;

			switch (interaction.type) {
				case 1:
					mesh.position.y -= 9;
					mesh.name = "block";
					break;
				case 2:
					mesh.rotation.set(Math.radians(-180), 0, 0);
					mesh.originalRotation = Math.radians(-180);
					mesh.name = "wheel";
					break;
				case 3:
					mesh.name = "door";
					for (var i = 0; i < mesh.children.length; i++) {
						mesh.children[i].name = "door"+i;
					}
					break;
				default:
					mesh.rotation.set(0, 0, 0);
					mesh.name = "block";
					break;
			}

			mesh.traverse(function (child) {
				if (child instanceof THREE.Mesh) {
					child.material = material
				}
			});

			LOADER.mesh.interactions[interaction.type] = mesh;
			LOADER.toLoad.current++;
		});

	}

	loadRoom(number) {
		var _this = this;

		// If object already loaded, skip mesh loading and
		// specified to loader that object is already loaded
		if(notNull(_this.mesh.rooms[number])) {
			_this.toLoad.current++;
			return;
		}

		// Prevent loading lot of time the same object
		_this.mesh.rooms[number] = true;

		new Promise(resolve => {
			_this.OBJLoader.load(PUBLIC_PATH + 'object/rooms/room' + number + '.obj', function (mesh) {
				resolve(mesh,number);
			});
		}).then((mesh) => {
			mesh.scale.set(_this.size, _this.size, _this.size);
			mesh.position.set(0, 0, 0);
			mesh.rotation.set(0, 0, 0);

			mesh.traverse(function (child) {
				if (child instanceof THREE.Mesh) {
					child.material = new THREE.MeshPhysicalMaterial({
						opacity: 1,
						color: '#262626',
						shading: THREE.SmoothShading,
						clearCoat: 5,
						reflectivity:1,
						clearCoatRoughness: 1,
						bumpScale  :  0.3
					});

					child.castShadow = true;
					child.receiveShadow = true;
				}
			});

			LOADER.mesh.rooms[number] = mesh;
			LOADER.toLoad.current++;
		});
	}

	loadMap(callback) {
		var _this = this;
		new Promise(function (resolve) {
			_this.OBJLoader.load(PUBLIC_PATH + '/object/map.obj', function (mesh) {
				resolve(mesh);
			});
		})
		.then(function (mesh) {
			let easeDist = 0;
			let index = 0;

			var children = [];
			mesh.traverse(function (child) {
				if (child instanceof THREE.Mesh) {
						children.push(child);
				}
			});

			// shuffle(children);
			let child = {};
			for (var i = 0; i < children.length; i++) {
				child = children[i];
				if (child instanceof THREE.Mesh) {
					child.material = new THREE.MeshPhysicalMaterial({
						color: RoomMaterial().color.basic,
						shading: THREE.SmoothShading,
						clearCoat: 5,
						map: _this.textures.room,
						clearCoatRoughness: 1,
						bumpScale  :  0.3
					});

					child.geometry.computeBoundingBox();
					child.name = "room";

					const boundingBox = child.geometry.boundingBox;

					let position = new THREE.Vector3();
					position.subVectors( boundingBox.max, boundingBox.min );
					position.multiplyScalar( 0.5 );
					position.add( boundingBox.min );

					position.applyMatrix4( child.matrixWorld );

					let distance = (Math.random()) * easeDist;
					easeDist += 0.003;

					let newPos = new THREE.Vector3();
					newPos.addVectors(child.position, position.multiplyScalar( distance ))
					child.position_origin = new THREE.Vector3(child.position.x,child.position.y,child.position.z);
					child.rand_ease = randFloat(1,5);
					child.canAnimateFinalState = true;

					if(notNull(LOADER.db.rooms[index])) {
							child.position.set(newPos.x, newPos.y, newPos.z);
					}

					if(notNull(LOADER.db.rooms[index])) {
						child.material = new THREE.MeshLambertMaterial({
							color: RoomMaterial().color.basic,
							shading: THREE.SmoothShading,
							// clearCoat: 5,
							// clearCoatRoughness: 1,
							// bumpScale  :  1
						});

						// if(!LOADER.db.rooms[index].is_finish) {
						// 	child.material.map = _this.textures.room
						// }

						child.roomId = LOADER.db.rooms[index]._id;
						child.db = LOADER.db.rooms[index];

						LOADER.mesh.mapRooms[index] = child;
						LOADER.db.map.rooms++;

						// if(LOADER.db.rooms[index].is_finish) {
						// 	LOADER.db.map.finished++;
						// }

					}
					index++;
				}
			}

			LOADER.mesh.map = mesh;
			if(typeof callback == 'function') {
				callback();
			}

		});
	}
}
