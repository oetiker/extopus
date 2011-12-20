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
    extend : ep.visualizer.AbstractData,

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
    construct : function(title, args) {
        this.base(arguments, title, args);
        var dataTable = new ep.ui.DataTable(args.instance, args.columns, args.column_widths, args.column_units);
        this.setDataTable(dataTable);
        this.add(dataTable, { flex : 1 });

        var titleContainer = this.getTitleContainer();

        // time span
        var rowLabel = new qx.ui.basic.Label(this.tr('rows')).set({ paddingLeft : 8 });
        titleContainer.addAt(rowLabel,1);
        var rowCount = new qx.ui.form.TextField("1").set({
            filter         : /[0-9]/,
            invalidMessage : this.tr('use values between 1 and 100')
        });

        titleContainer.addAt(rowCount,2);

        rowCount.addListener('changeValue', function(e) {
            var value = parseInt(e.getData(), 10);

            if (value < 1 || value > 100) {
                rowCount.set({ valid : false });
                return;
            }
            else {
                rowCount.set({ valid : true });
            }
            dataTable.setCount(value);
        },
        this);

        dataTable.setCount(1);
        this.setArgs(args);
    },

    statics : { KEY : 'data' },

    members : {
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
            dt.set({
                treeUrl : newArgs.treeUrl,
                hash    : newArgs.hash
            });
            /* trigger reload */
            dt.setNodeId(newArgs.nodeId);
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

            var url = this.getCsvUrl() + '&format=' + format + '&interval=' + data.getInterval() + '&end=' + end + '&count=' + data.getCount();
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
