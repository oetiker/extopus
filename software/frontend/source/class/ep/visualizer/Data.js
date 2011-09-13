/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/* ***************
#asset(qx/icon/${qx.icontheme}/16/actions/document-save.png)
#asset(qx/icon/${qx.icontheme}/16/actions/document-print.png)
#asset(qx/icon/${qx.icontheme}/16/apps/office-spreadsheet.png)
#asset(qx/icon/${qx.icontheme}/16/mimetypes/office-spreadsheet.png)
*************** */

/**
 * Show Data analysis page
**/
qx.Class.define("ep.visualizer.Data", {
    extend : ep.visualizer.AbstractVisualizer,

    /**
     * Setup the Data view. The arguments map must look like this:
     * 
     * <pre code='javascript'>
     * {
     *    intervals: [ { name: 'Daily', key: 'daily' }, { ... } ],
     *    treeUrl: 'url/to/fetch/data/from',
     *    hash:    'xxx',
     *    nodeId:  'nodeId',
     *    csvUrl:  'url/to/download/data',
     *    multiRecord: false
     * }
     * </pre>
     * 
     * @param title {String} tab title
     * @param args  {Map} configuration arguments.
     * @return {void} 
     *
     */
    construct : function(title, args, table) {
        this.base(arguments, title);
        this.__table = table;
        this.set({ layout : new qx.ui.layout.VBox(10) });
        var titleContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox(8).set({ alignY : 'middle' }));
        this.add(titleContainer);
        var dataTable = this.__dataTable = new ep.ui.DataTable(args.instance, args.columns, args.column_widths, args.column_units);
        this.add(dataTable, { flex : 1 });

        // view selector
        var intervalSelector = this.__intervalSelector = new qx.ui.form.VirtualSelectBox().set({
            labelPath     : 'name',
            width         : 100,
            maxListHeight : null
        });

        titleContainer.add(intervalSelector);
        var intervalSelection = intervalSelector.getSelection();

        intervalSelection.addListener("change", function(e) {
            var item = intervalSelection.getItem(0);
            if (item == null) {
                titleContainer.setEnabled(false);
                dataTable.setInterval(null);
            }
            else {
                titleContainer.setEnabled(true);
                dataTable.setInterval(item.getKey());
            }
        },
        this);

        // time span
        titleContainer.add(new qx.ui.basic.Label(this.tr('rows')).set({ paddingLeft : 8 }));
        
        var rowCount = this.__rowCount = new qx.ui.form.TextField("1").set({
            filter         : /[0-9]/,
            invalidMessage : this.tr('use values between 1 and 100')
        });

        titleContainer.add(rowCount);

        rowCount.addListener('changeValue', function(e) {
            var value = parseInt(e.getData(), 10);

            if (value < 1 || value > 100) {
                rowCount.set({ valid : false });
                return;
            }
            else {
                rowCount.set({ valid : true });
            }

            dataTable.setCount(parseInt(e.getData(), 10));
        },
        this);

        dataTable.setCount(1);

        titleContainer.add(new qx.ui.basic.Label(this.tr('end date')).set({ paddingLeft : 5 }));

        var dateField = new qx.ui.form.DateField().set({
            value       : null,
            dateFormat  : new qx.util.format.DateFormat("dd.MM.yyyy"),
            placeholder : 'now'
        });

        this.__endDate = Math.round(new Date().getTime() / 1000);

        titleContainer.add(dateField);

        dateField.addListener('changeValue', function(e) {
            var date = e.getData();
            dataTable.setEndDate(date);
        },
        this);

        titleContainer.add(new qx.ui.core.Spacer(20), { flex : 1 });

        // create main menu and buttons
        var menu = new qx.ui.menu.Menu();

        var csvButton = new qx.ui.menu.Button(this.tr('Save CSV'), "icon/16/actions/document-save.png");
        var xlsButton = new qx.ui.menu.Button(this.tr('Save Excel 2003 XLS'), "icon/16/apps/office-spreadsheet.png");
        var xlsxButton = new qx.ui.menu.Button(this.tr('Save Excel 2010 XLSX'), "icon/16/mimetypes/office-spreadsheet.png");

        // add execute listeners
        csvButton.addListener("execute", function() {
            this._downloadAction('csv');
        }, this);

        xlsButton.addListener("execute", function() {
            this._downloadAction('xls');
        }, this);

        xlsxButton.addListener("execute", function() {
            this._downloadAction('xlsx');
        }, this);

        // add buttons to menu
        menu.add(csvButton);
        menu.addSeparator();
        menu.add(xlsButton);
        menu.add(xlsxButton);

        var menuButton = new qx.ui.form.MenuButton(this.tr('File'), null, menu);

        titleContainer.add(menuButton);

        this.setArgs(args);
    },

    statics : { KEY : 'data' },

    members : {
        __dataTable : null,
        __rowCount: null,
        __intervalSelector : null,
        __endDate : null,
        __csvUrl : null,
        __table : null,
        __selTrack : false,
        /**
         * Setup visualizer with new configuration
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _applyArgs : function(newArgs, oldArgs) {
            var intervalModel = qx.data.marshal.Json.createModel(newArgs.intervals);
            var iSel = this.__intervalSelector.getSelection();
            var newItem = intervalModel.getItem(0);
            var oldSel = iSel.getItem(0);
            if (oldSel){
                var oldKey = oldSel.getKey();
                intervalModel.forEach(function(item){
                    if (item.getKey() == oldKey){
                        newItem = item;
                    }
                });
            }
            this.__intervalSelector.setModel(intervalModel);
            iSel.removeAll();
            iSel.push(newItem);
            var dt = this.__dataTable;
            this.__csvUrl = newArgs.csvUrl;
            if (newArgs.multiRecord){
                this.__rowCount.exclude();
                this.__selTrack = true;
                dt.clearCache();
            }
            else {
                this.__rowCount.show();
                dt.set({
                    treeUrl : newArgs.treeUrl,
                    hash    : newArgs.hash
                });
                this.__selTrack = false;
                /* trigger reload */
                dt.setNodeId(newArgs.nodeId);
            }
        },

        /**
         * Connect the data table to the record selection of the view table
         *
         * @param table {var} pointer to the view table widget.
         * @return {void} 
         */

        _hookSelection: function(table){
	        var sm = table.getSelectionModel();
	        var tm = table.getTableModel();
            sm.addListener('changeSelection', function(e) {
            	if (! this.__selTrack){
        		    return;
                }
	            var recId = [];
                sm.iterateSelection(function(ind) {
	                recId.push(tm.getValue(0, ind));
    		    });
    	    	this.__dataTable.setRecordIds(recId);
            },this);
        },

        /**
         * Download data to the client
         *
         * @param format {var} in which format do we want the data.
         * @return {void} 
         */
        _downloadAction : function(format) {
            var data = this.__dataTable;
            var end = Math.round(new Date().getTime() / 1000);

            if (data.getEndDate()) {
                end = Math.round(data.getEndDate().getTime() / 1000);
            }

            var url = this.__csvUrl + '&format=' + format + '&interval=' + data.getInterval() + '&end=' + end + '&count=' + data.getCount();
            var win = qx.bom.Window.open(url, '_blank');

            qx.bom.Event.addNativeListener(win, 'load', function(e) {
                var body = qx.dom.Node.getBodyElement(win);
                var doc = qx.dom.Node.getDocumentElement(win);

                /* if the window is empty, then it got opened externally */

                if ((doc && qx.dom.Hierarchy.isEmpty(doc)) || (body && qx.dom.Hierarchy.isEmpty(body))) {
                    win.close();
                }
            });
        }
    }
});
