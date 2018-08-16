/** This class renders the panel displaying each tabular output CRAVAT dataset */
define(['views/sidebar', 'views/table'],
	function(Sidebar, Table){
		return Backbone.View.extend({
			className :'contentTab',

			events : {
				'click .load' : 'tableLoadingIndicator'
			},

			initialize : function(params){
				this.model = params.model;
				this.name = this.model.get('name');
				this.index = params.n;
				this.frameViewer = params.frameViewer;
				this.dataTable = new Table({name : this.model.name + '-datatable', model : this.model, frameViewer : this.frameViewer});

				this.sidebar = new Sidebar({model: this.model});

				this.loadIndicator();

				this.model.on('change:ID', this.loadTable, this);
				this.model.on('change:Unique values', this.renderSidebarLoader,this);
				this.firstRun = true;
			},

			// Displays a loading indicator while plugin is loading data for table.
			loadIndicator : function(){
            	this.$el.append('<div class="indicator"><h2>Retrieving Data...</h2><div class="loaderIndicator"></div></div>');
			},

			// Renders the sidebar loader is there is too much data.
			// Now deprecated with the inclusion of AJAX-loading for the DataTable.
			/*renderSidebarLoader : function(){
				if (this.model.has('Unique values')){
					this.sidebar.renderLoader();
					this.$el.html(this.sidebar.el);
					this.$el.append(this.dataTable.el);
					this.model.off('change:Unique values');
				} 
			},*/

			loadTable : function(){
				if (!this.model.has('Unique values')){
					this.$el.html(this.sidebar.el);
					this.$el.append(this.dataTable.el);
				}
				this.updateButton();
				this.dataTable.loadTable(this.model.get('ID'));
			},

			// Updates buttons for panels that have finished loading.
			updateButton : function(){
				$('.nav-tabs button:eq(' + this.index + ')').removeClass('loading');
				$('.nav-tabs button:eq(' + this.index + ')').addClass('loaded');
			}
		});
	});
