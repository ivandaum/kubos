var Navigator = {
	links: document.querySelectorAll('.navigator-link'),
	init: function() {
		for(var e=0; e<this.links.length; e++) {
			this.links[e].addEventListener('click',function() {
				var target = this.dataset.target;

				if(!target) {
					console.log('No data-target specified.');
					return false;
				}

				Navigator.goTo(target);
			});
		}

		var input = document.querySelector('.user-new-name');
		input.addEventListener('keydown',function(e) {
			if(e.which != 13) return;

			var name = document.querySelector('.user-new-name').value;
			USER.changeName(name,function() {
				USER.enter('map');
			});
		});

	},
	goTo: function(div) {
		var target = document.querySelector('#' + div);

		if(target) {
			var containers = document.querySelectorAll('.container');
			for(var e=0; e<containers.length; e++) {
				containers[e].style.display = 'none';
			}
			target.style.display = 'block';
		}
	},
	bindBackButton: function() {
		window.onpopstate = function(e) {
			console.log(e);
			e.preventDefault();
			if(e.state){
				console.log(e);
				document.getElementById("content").innerHTML = e.state.html;
				document.title = e.state.pageTitle;
			}
		};
	},
	setUrl: function(url) {
		window.history.pushState({},"", url);
	}
};