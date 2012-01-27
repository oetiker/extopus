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
     *    csvUrl:  'url/to/download/data',
     *    recId:   xxx
     * }
     * </pre>
     * 
     * @param title {String} tab title
     * @param args  {Map} configuration arguments.
     * @return {void} 
     *
     */
    construct : function(title, args,view) {
        var form = this._cfgForm = new ep.ui.FormBar([
            {
                key: 'interval',
                widget: 'selectBox',
                set: {
                    width         : 100
                }       
            },
            {
                key: 'rows',
                widget: 'text',
                label: 'Rows',
                set: {
                    value: "1",
                    filter: /\d+/
                }
            },
            {
                key: 'endTime',
                widget: 'date',
                label: 'End'
            }
        ]);
        this.base(arguments, title, args,view,form);
        this._vizKey = this.self(arguments).KEY;
        var dataTable = this._dataTable = new ep.visualizer.data.DataTable(args.instance, args.columns, args.column_widths, args.column_units);
        this._add(dataTable, { flex : 1 });

        this.setArgs(args);
        this._updateData(form);
    },

    statics : { KEY : 'data' },

    members : {
        /**
         * Update Chart Event Handler
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _updateData: function(e){
            var d = e.getData();
            var t = this._dataTable;
            if (! d.rows){
                return;
            }
            this._userCfg = d;
            t.setCount(parseInt(d.rows));
            t.setInterval(d.interval);
            t.setEndDate(d.endTime);
        },
        /**
         * Setup visualizer with new configuration
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _applyArgs : function(newArgs, oldArgs) {
            this.base(arguments, newArgs, oldArgs);                 
            this._dataTable.setRecId(newArgs.recIds[0]);
        },

        /**
         * Download data to the client
         *
         * @param format {var} in which format do we want the data.
         * @return {void} 
         */
        _downloadAction : function(format) {
            var data = this._dataTable;
            var end = Math.round(new Date().getTime() / 1000);

            if (data.getEndDate()) {
                end = Math.round(data.getEndDate().getTime() / 1000);
            }

            var url = this._csvUrl  + '?format=' + format 
                                       + '&interval=' + data.getInterval() 
                                       + '&end=' + end 
                                       + '&recid=' + this.getArgs().recIds[0]
                                       + '&count=' + data.getCount();
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
