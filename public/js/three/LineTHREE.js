class LineTHREE {
  constructor() {
    var lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 4,
      linecap: 'round',
	    linejoin:  'round'
    });
    var lineGeometry = new THREE.Geometry();
    this.woolNodes = 2;
    this.woolSegLength = 2;
    this.accuracy =1;
    this.verts = [];

      for (var i=0; i < this.woolNodes; i++	){
        var v = new THREE.Vector3( 0, 0, 0);
        lineGeometry.vertices.push(v);

      }

    lineGeometry.dynamic = true;
    this.interactionLine = new THREE.Line(lineGeometry, lineMaterial);

  }

  rebootLine(){
    this.interactionLine.geometry.vertices.push(this.interactionLine.geometry.vertices.shift());
    this.interactionLine.geometry.vertices[2 - 1] = new THREE.Vector3(0,0,0);
    this.interactionLine.geometry.vertices[2 - 2] = new THREE.Vector3(0, 0, 0);
    this.interactionLine.geometry.verticesNeedUpdate = true;
  }

  updateStart(data) {
    // TODO: if time pas injecter le start en permanence
    this.interactionLine.geometry.vertices.push(this.interactionLine.geometry.vertices.shift());
    this.interactionLine.geometry.verticesNeedUpdate = true;
  }


  update(data) {

    //this.interactionLine.geometry.vertices = [];
    this.interactionLine.geometry.vertices.push(this.interactionLine.geometry.vertices.shift());
    this.interactionLine.geometry.vertices[2 - 1] = new THREE.Vector3(data.vectorEnd.x, data.vectorEnd.y, 0);
    this.interactionLine.geometry.vertices[2 - 2] = new THREE.Vector3(data.vectorStart.x, data.vectorStart.y, 0);
    //this.interactionLine.geometry.vertices.vertices[2] = new THREE.Vector3(data.vectorEnd.x, data.vectorEnd.y, 100);
    this.interactionLine.geometry.verticesNeedUpdate = true;

  }


}
