/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create a table widget for the Data visualizer.
 */
qx.Class.define("ep.ui.DataTable", {
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
        columns.unshift('');
        widths.unshift(15);
        var tm = this.__model = new qx.ui.table.model.Simple().set({ columns : columns });

        var tableOpts = {
            tableColumnModel : function(obj) {
                return new qx.ui.table.columnmodel.Resize(obj);
            }
        };

        var table = new qx.ui.table.Table(tm, tableOpts).set({
            allowShrinkX : true,
            allowShrinkY : true,
            allowGrowX   : true,
            allowGrowY   : true
        });

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
         * url on the torrus server where we get our data from
         */
        treeUrl : {
            init     : null,
            nullable : true
        },
        /**
         * a hash provided by the server authorizing us to request the given nodeId from the treeUrl
         */
        hash : {
            init     : null,
            nullable : true
        },
        /**
         * id of the current node
         */
        nodeId : {
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
            check    : 'Date',
            apply    : 'reloadTable',
            nullable : true
        },
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
        __model : null,
        __recCache : null,

        /**
         * drop cached records
         *
         * @return {void} 
         */
        clearCache: function(){
            this.__recCache = {};
        },
        
        /**
         * reload the table if all the required data is provided
         *
         * @return {void} 
         */
        reloadTable : function() {
            if (this.getInterval() && this.getTreeUrl() && this.getNodeId() && this.getHash()) {
                var rpc = ep.data.Server.getInstance();
                var date = Math.round(new Date().getTime() / 1000);

                if (this.getEndDate()) {
                    date = Math.round(this.getEndDate().getTime() / 1000);
                }

                var tm = this.__model;
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
                    count    : this.getCount(),
                    treeUrl  : this.getTreeUrl(),
                    nodeId   : this.getNodeId(),
                    hash     : this.getHash()
                });
            }
            else {
                this.setViewMode('nodata');
            }
        }
    }
});
