var Avatar = function(user,position) {
    var _this = this
    this.mesh = new THREE.Object3D()
    this.name = null
    this.shape = null
    this.scale = 0.1
    this.radius = 4
    var color = user.color

    var geometry = new THREE.SphereBufferGeometry(this.radius,50,50)
    var material = new THREE.MeshLambertMaterial({color:rgbToHex(color.r,color.g,color.b)})
    this.shape = new THREE.Mesh(geometry, material);


    // NAME
    var loader = new THREE.FontLoader();
    loader.load( 'public/fonts/droidsans/droid_sans_bold.typeface.json', function ( font ) {
      var textGeometry = new THREE.TextGeometry( user.name, {
        font: font,
        size: 2,
        height:0,
        bevelThickness:2,
        bevelSize: 1
      });

      var textMaterial = new THREE.MeshBasicMaterial({
        color:'#fff'
      })
      _this.name = new THREE.Mesh(textGeometry,textMaterial)

      _this.mesh.add(_this.shape)
      _this.mesh.add(_this.name)

      _this.name.position.y += 5
    });

    return this
}
