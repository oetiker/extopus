/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPL V3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * An {@link qx.ui.table.model.Remote} implementation for accessing
 * accessing Messreihen on the server.
 */
qx.Class.define('ep.data.NodeTableModel', {
    extend : qx.ui.table.model.Remote,
    type : 'singleton',


    /**
     * Create an instance of Rpc.
     */
    construct : function(columns) {
        this.base(arguments);
        var trans = qx.locale.Manager;
    },

    properties : {
        /**
         * when set to null all records show
         * when set to 'none' no records get selected
         */
        search : {
            nullable : true,
            apply    : '_applySearch'
        }
    },    

    members : {
        /**
         * Provid our implementation to make remote table work
         */
        _loadRowCount : function() {
            var rpc = ep.data.Server.getInstance();
            var that = this;
            var search = this.getSearch();
            rpc.callAsync(function(ret,exc) {
                if (exc) {
                    ep.ui.MsgBox.getInstance().exc(exc);
                }
                that._onRowCountLoaded(ret);
            }, 'getNodeCount', search);
        },


        /**
         * Reload the table data when the tagId changes.
         *
         * @param newValue {Integer} New TagId
         * @param oldValue {Integer} Old TagId
         */
        _applySearch : function(newValue, oldValue) {
            if (newValue != oldValue){
                this.reloadData();
            }
        },


        /**
         * Provide our own implementation of the row data loader.
         *
         * @param firstRow {Integer} first row to load
         * @param lastRow {Integer} last row to load
         */
        _loadRowData : function(firstRow, lastRow) {
            var rpc = ep.data.Server.getInstance();
            var that = this;
            rpc.callAsyncSmart(function(ret) {
                that._onRowDataLoaded(ret);
            },
            'getNodes', this.getSearch(),lastRow-firstRow,firstRow);
        }
    }
});
