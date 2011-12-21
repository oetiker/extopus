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
qx.Class.define("ep.visualizer.MultiData", {
    extend : ep.visualizer.AbstractData,

    /**
     * Setup the Data view. The arguments map must look like this:
     * 
     * <pre code='javascript'>
     * {
     *    intervals: [ { name: 'Daily', key: 'daily' }, { ... } ],
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
        this.base(arguments, title, args);
        var dataTable = new ep.ui.MultiDataTable(args.instance, args.columns, args.column_widths, args.column_units);

        this.setDataTable(dataTable);

        this.add(dataTable, { flex : 1 });
        this.setArgs(args);

        dataTable.addListener('changeTitle',function(e){
            var title = e.getData();
            this.setLabel(title);
        },this);

        dataTable.addListener('changeCaption',function(e){
            var caption = e.getData();
            this.setUserData('caption',caption);
        },this);

        var sm = this.__selectionModel = table.getSelectionModel();
        this.__changeListernerId = sm.addListener('changeSelection', function(e) {
            dataTable.setRecordIds(table.getSelectedRecordIds());
        },this);
        
        dataTable.setRecordIds(table.getSelectedRecordIds());
    },

    statics : { KEY : 'multidata' },

    members : {
        __changeListenerId: null,
        __selectionModel: null,
        /**
         * Remove the Table Change listener when we unhook
         */

        onUnhook: function(){
            this.__selectionModel.removeListenerById(this.__changeListernerId);
        },
        /**
         * Setup visualizer with new configuration
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _applyArgs : function(newArgs, oldArgs) {
            this.base(arguments,newArgs, oldArgs);
            var dt = this.getDataTable();
            /* trigger reload */
            dt.resetRecordIds()
        },

        /**
         * Download data to the client
         *
         * @param format {var} in which format do we want the data.
         * @return {void} 
         */
        _downloadAction : function(format) {
            var data = this.getDataTable();
            var end = Math.round(new Date().getTime() / 1000);

            if (data.getEndDate()) {
                end = Math.round(data.getEndDate().getTime() / 1000);
            }

            var url = this.getCsvUrl() + '?format=' + format + '&interval=' + data.getInterval() + '&end=' + end + '&recid=' + data.getRecordIds().join(',');
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
