/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create a table widget for the Data visualizer.
 */
qx.Class.define("ep.visualizer.data.DataTable", {
    extend : ep.ui.LoadingBox,

    /**
     * setup the data table
     * 
     * @param instance {String} instance name
     * @param columns {Array} column names
     * @param widths {Array} relative column widths
     * @param units {Array} units for the column renderers
     */
    construct : function(instance, columns, widths, units) {
        this.setInstance(instance);
        var tm = this._model = new qx.ui.table.model.Simple().set({ columns : columns });

        var tableOpts = {
            tableColumnModel : function(obj) {
                return new qx.ui.table.columnmodel.Resize(obj);
            }
        };

        var table = new qx.ui.table.Table(tm, tableOpts).set({
            allowShrinkX : true,
            allowShrinkY : true,
            allowGrowX   : true,
            allowGrowY   : true,
            /* make sure the table is a good citizen layout */
            height: 30,
            width: 50,
            showCellFocusIndicator : false,
            statusBarVisible: false 

        });

        table.getDataRowRenderer().setHighlightFocusRow(false);

        var tcm = table.getTableColumnModel();
        var resizeBehavior = tcm.getBehavior();

        this.clearCache();
        for (var i=0; i<columns.length; i++) {
            if (widths[i]) {
                resizeBehavior.setWidth(i, String(widths[i]) + '*');
            }

            if (units[i]) {
                var num = new qx.ui.table.cellrenderer.Number();
                var format = new qx.util.format.NumberFormat('en_US').set({ postfix : ' ' + units[i] });
                num.setNumberFormat(format);
                tcm.setDataCellRenderer(i, num);
            }
        }

        this.base(arguments, table);
    },

    properties : {
        /**
         * instance name of the table. This lets us identify ourselfs when requesting data from the server
         */
        instance : {
            init     : null,
            nullable : true
        },
        /**
         * id of the current node
         */
        recId : {
            init     : null,
            apply    : 'reloadTable',
            nullable : true
        },
        /**
         * time interval
         */
        interval : {
            init     : null,
            apply    : 'reloadTable',
            nullable : true
        },
        /**
         * number of data rows to request
         */
        count : {
            init     : null,
            check    : 'Integer',
            apply    : 'reloadTable',
            nullable : true
        },
        /**
         * last date of the analysis
         */
        endDate : {
            init     : null,
            check    : 'Integer',
            apply    : 'reloadTable',
            nullable : true
        },
        /* the caption for this table */
        caption: {
            init     : 'No Caption',
            nullable : true,
            event    : 'changeCaption'
        }
    },

    members : {
        _model : null,
        /**
         * drop cached records
         *
         * @return {void} 
         */
        clearCache: function(){
            this._recCache = {};
        },
        
        /**
         * reload the table if all the required data is provided
         *
         * @return {void} 
         */
        reloadTable : function() {
            if (this.getInterval() && this.getRecId()) {
                var rpc = ep.data.Server.getInstance();
                var date = Math.round(new Date().getTime() / 1000);

                if (this.getEndDate()) {
                    date = this.getEndDate();
                }

                var tm = this._model;
                this.setViewMode('loading');
                var that = this;

                rpc.callAsyncSmart(function(ret) {
                    if (ret.status) {
                        that.setViewMode('ready');
                        tm.setData(ret.data);
                        that.setCaption(ret.caption);
                    }
                    else {
                        that.setViewMode('nodata');
                        tm.setData([]);
                    }        
                },
                'visualize', this.getInstance(), {
                    interval : this.getInterval(),
                    endDate  : date,
                    count    : this.getCount(),
                    recId    : this.getRecId()
                });
            }
            else {
                this.setViewMode('nodata');
            }
        }
    }
});
