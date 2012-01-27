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
    construct : function(title, args, view, form) {
        this.base(arguments, title, args, view);
        this._setLayout(new qx.ui.layout.VBox(10));
        var titleContainer = this.__titleContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox(8).set({ alignY : 'middle' }));
        this._add(titleContainer);

        titleContainer.add(form);

        titleContainer.add(new qx.ui.core.Spacer(20), { flex : 1 });

        form.addListener('changeData',this._updateData,this);

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

    members : {
        __titleContainer: null,
        _csvUrl: null,
        /**
         * Setup visualizer with new configuration
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _applyArgs : function(newArgs, oldArgs) {
            var v = newArgs.intervals || [];
            var sb = [];
            for (var i=0;i<v.length;i++){
                sb.push({title: v[i].name, key: v[i].key}); 
            }
            if (sb.length == 0){
                this.__titleContainer.setEnabled(false);
            }
            var cfg = this._userCfg;
            this._cfgForm.setSelectBoxData('interval',sb );
            this._csvUrl = newArgs.csvUrl;
            this.base(arguments, newArgs, oldArgs);
            this._cfgForm.setData(cfg);
        },
        /**
         * force the _updateData function to be overwritten 
         */
        _updateData: function(){
            throw new Error('Your Implementation must provide a _updateData method');
        }
        
    }
});
