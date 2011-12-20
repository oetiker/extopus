/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create a table widget for the Data visualizer.
 */
qx.Class.define("ep.ui.MultiDataTable", {
    extend : ep.ui.DataTable,

    properties : {
        /**
         * recordIds
         */
        recordIds: {
            init: null,
            check: 'Array',
            apply: 'reloadTable',
            nullable: true
        }
        
    },

    members : {
        /**
         * reload the table if all the required data is provided
         *
         * @return {void} 
         */
        reloadTable : function() {
            if (this.getInterval() && this.getRecordIds() && this.getRecordIds().length > 0 ) {
                var rpc = ep.data.Server.getInstance();
                var date = Math.round(new Date().getTime() / 1000);

                if (this.getEndDate()) {
                    date = Math.round(this.getEndDate().getTime() / 1000);
                }

                var tm = this._model;
                this.setViewMode('loading');
                var that = this;

                rpc.callAsyncSmart(function(ret) {
                    if (ret.status) {
                        that.setViewMode('ready');
                        tm.setData(ret.data);
                    }
                    else {
                        that.setViewMode('nodata');
                        tm.setData([]);
                    }
                },
                'visualize', this.getInstance(), {
                    interval : this.getInterval(),
                    endDate  : date,
                    recList  : this.getRecordIds()
                });
            }
            else {
                this.setViewMode('nodata');
            }
        }
    }
});
