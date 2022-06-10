/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

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
     * @param instance {String} unique key for visualizer
     * @param title {String} tab title
     * @param args  {Map} configuration arguments.
     * @return {void} 
     *
     */
    construct : function(instance,title, args, view) {
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

        this.base(arguments, instance, title, args, view, form);

        var dataTable = this._dataTable = new ep.visualizer.data.MultiDataTable(instance, args.columns, args.column_widths, args.column_units);
    
        dataTable.addListener('changeCaption',function(e){
            this.setCaption(e.getData());
        },this);

        this._add(dataTable, { flex : 1 });

        this.setArgs(args);
        this._updateData(form);
        
        if (view){
            this.__view = view;
            this.__viewListener = view.addListener('changeRecIds', function(e) {
                var ids = e.getData();
                /* we have to have two items selected in any case */
                if (ids.length > 1){        
                    dataTable.setRecordIds(ids);
                }
                this.setRecIds(ids);
            },this);            
        }
        dataTable.setRecordIds(args.recIds);
    },

    statics : { KEY : 'multidata' },

    members : {
        
        __viewListener: null,
        __view: null,

        /**
         * sever the connection to the record selection once the view is unhooked
         */            
        unhook: function(){
            if (this.__view){
                this.__view.removeListenerById(this.__viewListener);
            }
        },
        /**
         * Update Chart Event Handler
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _updateData: function(e){
            var d = e.getData();
            this._userCfg = d;
            if (! d.rows){
                return;
            }
            var t = this._dataTable;
            t.setCount(parseInt(d.rows));
            t.setInterval(d.interval);
            t.setEndDate(d.endTime);
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
                end = Math.round(data.getEndDate());
            }

            var url = this._csvUrl + '?format=' + format + '&interval=' + data.getInterval() + '&end=' + end + '&recid=' + data.getRecordIds().join(',')
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
