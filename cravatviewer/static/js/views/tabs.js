/** Renders tabs for each panel*/
define([],
	function(){
		return Backbone.View.extend({
			
			className : 'nav-tabs',

			initialize: function(options){
				this.tabNames = ['Summary', 'Gene', 'Variant', 'Noncoding', 'Error'];
				this.panels = options.panels;
				this.index = options.index + 1;
				this.render();
			},

			render: function(){
				var button;
				for (var i = 0; i < this.tabNames.length; i++){
					button = new TabButton({name: this.tabNames[i], panel: this.panels[i]});
					this.$el.append(button.el);
				}
			}
		});
	});

var TabButton = Backbone.View.extend({

	tagName : 'button',

	className : 'loading',

	events: {
			'click' : 'switchTab'
	},

	initialize: function(options){
		this.name = options.name;
		this.panel = options.panel;
		this.render();
	},

	render: function(){
		this.$el.html(this.name);
	},

	switchTab: function() {
		$('.' + this.panel.className).hide();
		this.panel.$el.show();
		$('.nav-tabs button').removeClass('active');
		this.$el.addClass('active');
		if (this.panel.dataTable){
			if (this.panel.id != 'Summary'){
				this.panel.dataTable.draw();
			}
		}
	}
});