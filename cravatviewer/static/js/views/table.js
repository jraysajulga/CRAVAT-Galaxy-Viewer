define([],
	function(){
		return Backbone.View.extend({

			className : 'right-cell',

			initialize: function(options){
				this.name = options.name;
				this.model.on('change:shownHeaders',this.refreshHeaders, this);
				this.firstRun = true;
				this.frameViewer = options.frameViewer;
				this.render();
			},

			render : function(){
				$view = $('<div>', {'class' : 'table-view'});
				$table = $('<div>', {'class' : 'dataTableView'});

				this.$selectedPanel = $('<div>', {'class' : 'selected-panel'});
				$table.append(this.$selectedPanel);
				var panelClass = this.frameViewer ? ' top-panel' : '';
				$table.append('<div id="' + this.name + 'DataTable" class="data-table ' + panelClass +'" style="display: none;"><table id="' + this.name + '"></table></div>');	

				$view.append($table);
				if (this.model.name == 'Variant'){
					$view.append("<div class='frame'><iframe id='variantviewer'></iframe></div>");
				} else if (this.model.name == 'Gene'){
					$view.append('<table id="example"></table>');
				}
				this.$el.append($view);
			},

			loadingIndicator : function(){
				this.$el.html('<div class="indicator"><h2>Retrieving Data...</h2><div class="loaderIndicator"></div></div>');
			},

			loadGeneTable : function(row_data){
				if (row_data.length >= 8){
					var gene = row_data[8];
				} else {
					// Initialize table
					var dataset = this.model.collection.at(2).get('Gene data');
					if (dataset){
						var headers = this.formatToDataTableHeader(dataset.shift());
						$('table#example').DataTable({
							data : dataset,
							columns : headers
						});
					}
				}
			},

			loadTable : function(ID){
				// Initializes the table
				this.dataTable = $('#' + this.name);

				var view = this;
				var tableData = this.model.get('data');

				if ( $.fn.dataTable.isDataTable( this.dataTable ) ){
					this.dataTable.DataTable().destroy();
				}

		        var allHeaders = this.model.get('All headers');

		        var headers = '<tr><th>' + allHeaders.join('</th><th>') + '</th></tr>';

		        headerHTML = '<thead>' + headers + '</thead>';
		        $('#' + this.name + 'DataTable').show();
		        $('#' + this.name).html(headerHTML);

		        var data = [];
		        for ( var i=0 ; i<50000 ; i++ ) {
		            data.push( [ i, i, i, i, i ] );
		        }

		        // Functions for sorting without including blank cells
		        jQuery.fn.dataTableExt.oSort['mystring-asc'] = function(x,y) {
					var retVal;
					x = $.trim(x);
					y = $.trim(y);

					if (x==y) retVal= 0;
					else if (x == "" || x == " ") retVal= 1;
					else if (y == "" || y == " ") retVal= -1;
					else if (x > y) retVal= 1;
					else retVal = -1;

					return retVal;
				};
				jQuery.fn.dataTableExt.oSort['mystring-desc'] = function(y,x) {
					var retVal;
					x = $.trim(x);
					y = $.trim(y);

					if (x==y) retVal= 0; 
					else if (x == "" || x == " ") retVal= -1;
					else if (y == "" || y == " ") retVal= 1;
					else if (x > y) retVal= 1;
					else retVal = -1;

					return retVal;
				};
				sorting_index = allHeaders.indexOf('VEST p-value') >= 0 ? allHeaders.indexOf('VEST p-value') : 0;

                var oTable = this.dataTable.DataTable( {
                    "ajax": {
                        "url": '/api/datasets/' + this.model.get('ID'),
                        contentType: 'application/json; charset=utf-8',
                        dataType : 'json',
                        "data": {data_type : 'raw_data',
                            provider : 'column',
                            limit : 100000,
                            offset: 1},
                    	// Fill ins missing trailing data with blanks
	                    'dataSrc' : function (json) {
	                    	var returned_data = [];
	                    	var length = allHeaders.length;
	                    	var diff;
	                    	var data = json.data;
	                    	for (var i = 0; i < data.length; i++){
	                    		diff = length - data[i].length;
	                    		if (diff > 0){
	                    			for (var n = 0; n < diff; n++){
	                    				data[i].push('');
	                    			}
	                    		}
	                    		returned_data.push(data[i]);
	                    	}
	                    	return returned_data;
	                    },
                    },
                    deferRender:    true,
		            scroller:       true,
		            select : true,
		            "order": [[sorting_index, "asc"]],
		            "sScrollX" : "100%",
		            "processing": true,
		            'bAutoWidth': false,
		            'bPaginate': true,
					language: {
					   emptyTable: "No data available in table", // 
					   loadingRecords: "Please wait .. ", // default Loading...
					   zeroRecords: "No matching records found"
					  },
					columnDefs: [ {
					 	targets : '_all',
					 	"type" : "mystring",
						render: function ( data, type, row ) {
							var limit = 18;
							var n = 3;
							var output = data;
							var re = new RegExp('[A-Z]+');
							var m;
							var index = row.indexOf(data);
							var variant = data;
							if (type === 'display'){
						        m = data.match(re);
						        if (m && index == view.model.get('All headers').indexOf('Variant peptide')){
						        	// Account for large insertions and deletions
						        	reference = row[view.model.get('All headers').indexOf('Reference peptide')];
						        	variant = row[view.model.get('All headers').indexOf('Variant peptide')];
						        	variant = view.highlight_mutated_amino_acid(reference, variant, limit);
						        	return variant;
						        }
							}
							if (type === 'display' && variant.length > limit){
								variant = variant.substr( 0, limit);
								return variant + '...';
							} else{
								return variant;
							}
						  }
						},
					],
					'drawCallback': function( settings ) {
						view.fixHeaderWidth();
					},
                    'initComplete': function(settings, json) {
						$('#' + view.name + 'DataTable').show();
						view.dataTable.DataTable().row(':eq(0)').select();

						if ($(view.dataTable.DataTable().column( 2 ).header()).html() == 'Chromosome'){
							$(view.dataTable.DataTable().column( 2 ).header()).html('Chromo<br />some');
						}
						//view.fixHeaderWidth();
						view.refreshHeaders();
						$(window).bind('resize', function () {
							view.fixHeaderWidth();
						});
					}
                } );
				if (this.frameViewer){
					view = this;
					this.dataTable.DataTable().on('select', function (e, dt, type, indexes) {
						if (type === 'row' ){
							var row_pos = view.dataTable.DataTable().row(indexes[0]).index();
							var row_data = view.dataTable.DataTable().row(row_pos).data();
							view.loadViewer(row_data);
						}
					});
				}
				
				$('#' + this.name + ' tbody').on('click', 'td', function () {
					view.dataTable.DataTable().cells('.selected').deselect();
					view.dataTable.DataTable().cell( this ).select();
					var datum = $(this).html();
					if (view.dataTable.DataTable().cell( this ).index().column == view.model.get('All headers').indexOf('Variant peptide')){
						variant_peptide = view.dataTable.DataTable().cell( this ).data();
						reference_peptide = view.dataTable.DataTable().row(view.dataTable.DataTable().cell( this ).index().row).data()[view.model.get('All headers').indexOf('Reference peptide')];
						datum = view.highlight_mutated_amino_acid(reference_peptide, variant_peptide, 100);
					}
					view.$selectedPanel.html(datum);
				});

				if (this.model.get('shownHeaders')){
					this.refreshHeaders();
				}
				this.firstRun = true;
			},

			highlight_mutated_amino_acid : function(reference, variant, limit){
				var positions = [];
				var pos;
				var variable = '<%= varAA %>';
				var front_tag = '<span style="color:#ff5151;font-weight:bold;">';
				var back_tag = '</span>';
				var template = front_tag + variable + back_tag;
				var replacement = 'N';
				var data_length;
				var tpl = _.template(template);
				var n = 3;
				var displayed_variant = variant;

	        	data_length = variant.length;
	        	for (var i = 0; i < variant.length; i++){
	        		if (variant[i] != reference[i]){
	        			positions.push(i);
	        		}
	        	}
	        	positions = positions.sort(function(a,b){
	        		return a < b;
	        	});
	        	var adjuster = 0;
	        	for (i = 0; i < positions.length; i++){
	        		pos = positions[i];
	        		replacement = variant.slice(pos, pos+1);
	        		if (pos < limit){ // If the mutated position is within the limit...
	        			displayed_variant = variant.slice(0,pos) + tpl({varAA: replacement}) + variant.slice(pos+1,limit);
	        		} else {
	        			displayed_variant = variant.slice(0,limit);
	        		}
	        	}
	        	if (limit < variant.length){
    				displayed_variant += '...';
    			}
	        	return displayed_variant;
			},



			fixHeaderWidth : function(){
				var children = $('#' + this.name + ' > tbody > tr.odd.selected').children();
				var headerChildren = $('#' + this.name + 'DataTable > div.dataTables_scroll > div.dataTables_scrollHead > div > table > thead > tr').children();
				var totalWidth = 0;
				var width;
				for (var i = 1; i <= children.length; i++){
					width = $('#' + this.name + ' > tbody > tr.odd.selected > td:nth-child(' + i + ')').width();
					totalWidth += $('#' + this.name + ' > tbody > tr.odd.selected > td:nth-child(' + i + ')').outerWidth();
					$('#' + this.name + '_wrapper > div > div > div> table > thead > tr > th:nth-child(' + i + ')').css('width',width + 'px');
					$('#' + this.name + '_wrapper > div > div > div> table > thead > tr > th:nth-child(' + i + ')').css('min-width',width + 'px');
					$('#' + this.name + '_wrapper > div > div > div> table > thead > tr > th:nth-child(' + i + ')').css('max-width',width + 'px');
				}	// Check if min and max widths are necessary
			},

			refreshHeaders : function(){
				var targetVisibility = this.dataTable.DataTable().columns().visible();
				var currentVisibility = this.model.columnVisibility();
				var col;
				var children = $('#' + this.name + ' > tbody > tr.odd.selected').children();
				for (var i = 0; i < children.length; i++){
					var width = 20;
					$('#' + this.name + '_wrapper > div > div > div> table > thead > tr > th:nth-child(' + i + ')').css('width',width + 'px');
					$('#' + this.name + '_wrapper > div > div > div> table > thead > tr > th:nth-child(' + i + ')').css('min-width',width + 'px');
					$('#' + this.name + '_wrapper > div > div > div> table > thead > tr > th:nth-child(' + i + ')').css('max-width',width + 'px');
				}
				for (var i = 0; i < targetVisibility.length; i++){
					if (targetVisibility[i] !== currentVisibility[i]){
						col = this.dataTable.DataTable().columns(i);
						col.visible(!col.visible()[0]);
					}
				}
				this.draw();
			},

			draw : function(){
				if ($.fn.DataTable.isDataTable(this.dataTable)){
					this.dataTable.DataTable().columns.adjust().draw();
					this.dataTable.DataTable().draw();
					this.fixHeaderWidth();
				}
			},

			formatToDataTableHeader : function(header){
				var header_columns = [];
				var value;
				for (var i = 0; i < header.length; i++){
					value = header[i];
					header_columns.push({title:value});
				}
				return header_columns;
			},

			loadTableData: function(ID){
				var view = this;
				var xhr = jQuery.getJSON("/api/datasets/" + ID, {
					data_type : 'raw_data',
					provider : 'column'
				});
				xhr.done( function( response ){
					view.headers = response.data.shift();
					view.data = response.data;
					view.fillOutEndData();
					view.renderTable(view.data, view.formatToDataTableHeader(view.headers));
				});
			},

			fillOutEndData: function(){
				for (var i = 0; i < this.data.length; i++){
					missing_len = this.headers.length - this.data[i].length;
					if (missing_len > 0){
						for (var j = 0; j < missing_len; j++){
							this.data[i].push("");
						}
					}
				}
			},

			loadViewer : function(row_data){
				var headers = this.model.get('All headers');
				var chrom = row_data[headers.indexOf('Chromosome')];
				var pos = row_data[headers.indexOf('Position')];
				var strand = row_data[headers.indexOf('Strand')];
				var ref = row_data[headers.indexOf('Reference base(s)')];
				var alt = row_data[headers.indexOf('Alternate base(s)')];
				var tpl = _.template('http://www.cravat.us/CRAVAT/variant.html?variant=<%= chr %>_<%= position %>_<%= strand %>_<%= ref_base %>_<%= alt_base %>');
				var link = tpl({chr: chrom,
					strand: strand,
					position: pos,
					ref_base: ref,
					alt_base: alt});
				$('#variantviewer').attr('src',link);
			},

			hideColumn : function(header){
				var table = $(this.idName + 'DataTable').DataTable();
				index = this.headers.indexOf(header);
				table.column(index).visible(false);
			},

			showColumn : function(header){
				var table = $(this.idName + 'DataTable').DataTable();
				var index = this.headers.indexOf(header);
				table.column(index).visible(true);
			},

			// If this header is not within the new header config, then hide it.
			displayColumns : function(new_headers){
				var all_headers = this.headers;
				var header;
				for (var i = 0; i < all_headers.length; i++){
					header = all_headers[i];
					new_headers.indexOf(header) < 0 ? this.hideColumn(header) : this.showColumn(header); // Should I expand this out?
				}
			}
		});
	});