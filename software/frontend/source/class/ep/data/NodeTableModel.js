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
        this.setFilter([]);
    },

    properties : {
        /**
         * when set to null all records show
         * when set to 'none' no records get selected
         */
        filter : {
            nullable : true,
            apply    : '_applyFilter'
        }
    },    

    members : {
        /**
         * Provid our implementation to make remote table work
         */
        _loadRowCount : function() {
            var rpc = ep.data.Server.getInstance();
            var that = this;
            var filter = this.getFilter();

            rpc.callAsync(function(ret,exc) {
                if (exc) {
                    ep.ui.MsgBox.getInstance().exc(exc);
                }
                that._onRowCountLoaded(ret);
            }, 'getNodeCount', filter);
        },


        /**
         * Reload the table data when the tagId changes.
         *
         * @param newValue {Integer} New TagId
         * @param oldValue {Integer} Old TagId
         */
        _applyFilter : function(newValue, oldValue) {
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
            var filter = this.getFilter();

            var rpcArgs = {
                firstRow : firstRow,
                lastRow  : lastRow,
                filter   : filter
            };

            if (!this.isSortAscending()) {
                rpcArgs.sortDesc = true;
            }

            var sc = this.getSortColumnIndex();

            if (sc >= 0) {
                rpcArgs.sortColumn = this.getColumnId(sc);
            }

            var rpc = ep.data.Server.getInstance();
            var that = this;

            rpc.callAsync(function(ret,exc) {
                if (exc) {
                    ep.ui.MsgBox.getInstance().exc(exc);
                }
                that._onRowDataLoaded(ret);
            },
            'getNodeList', rpcArgs);
        }
    }
});
