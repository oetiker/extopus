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
qx.Class.define("ep.visualizer.AbstractData", {

    extend : ep.visualizer.AbstractVisualizer,
    type : 'abstract',

    /**
     * Setup the Data view. The arguments map must look like this:
     * 
     * <pre code='javascript'>
     * {
     *    intervals: [ { name: 'Daily', key: 'daily' }, { ... } ],
     * }
     * </pre>
     * 
     * @param title {String} tab title
     * @param args  {Map} configuration arguments.
     * @return {void} 
     *
     */
    construct : function(title, args, view) {
        this.base(arguments, title, args, view);
        this.set({ layout : new qx.ui.layout.VBox(10) });
        var titleContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox(8).set({ alignY : 'middle' }));
        this.setTitleContainer(titleContainer);
        this.add(titleContainer);

        // view selector
        var intervalSelector = this._intervalSelector = new qx.ui.form.VirtualSelectBox().set({
            labelPath     : 'name',
            width         : 100,
            maxListHeight : null
        });

        titleContainer.add(intervalSelector);
        var intervalSelection = intervalSelector.getSelection();

        intervalSelection.addListener("change", function(e) {
            var item = intervalSelection.getItem(0);
            var dataTable = this.getDataTable();
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

        titleContainer.add(new qx.ui.basic.Label(this.tr('end date')).set({ paddingLeft : 5 }));

        var dateField = new qx.ui.form.DateField().set({
            value       : null,
            dateFormat  : new qx.util.format.DateFormat("dd.MM.yyyy"),
            placeholder : 'now'
        });

        this._endDate = Math.round(new Date().getTime() / 1000);

        titleContainer.add(dateField);

        dateField.addListener('changeValue', function(e) {
            var date = e.getData();
            this.getDataTable().setEndDate(date);
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
    },

    properties: {
        /**
         * the widget showing the actual data
         */
        dataTable: {
            init: null            
        },
        /**
         * the title widget
         */
        titleContainer: {
            init: null
        },
        /**
         * the csvUrl
         */
        csvUrl: {
            init: null
        }

    },
    members : {
        _intervalSelector : null,
        _endDate : null,
        /**
         * Setup visualizer with new configuration
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _applyArgs : function(newArgs, oldArgs) {
            var intervalModel = qx.data.marshal.Json.createModel(newArgs.intervals);
            var iSel = this._intervalSelector.getSelection();
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
            this._intervalSelector.setModel(intervalModel);
            iSel.removeAll();
            iSel.push(newItem);
            this.setCsvUrl(newArgs.csvUrl);
        }
    }
});
