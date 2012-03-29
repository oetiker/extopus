/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create a table widget for the Data visualizer.
 */
qx.Class.define("ep.visualizer.data.DirectDataTable", {
    extend : ep.ui.LoadingBox,

    /**
     * setup the data table
     * 
     * @param instance {String} instance name
     * @param columns {Array} column names
     * @param widths {Array} relative column widths
     * @param units {Array} units for the column renderers
     */
    construct : function(instance) {
        this.setInstance(instance);
        var tm = new qx.ui.table.model.Simple().set({ columns : ['Item','Value','Chart'] });

        var tableOpts = {
            tableColumnModel : function(obj) {
                return new qx.ui.table.columnmodel.Resize(obj);
            }
        };

        var table = this._table = new qx.ui.table.Table(tm, tableOpts).set({
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
        var barRenderer = this._barRenderer = new canvascell.Renderer(
            new canvascell.plotter.Bar({
                fill   : '#0066A8',
                border : '#0066A8'
            })
        );
        tcm.setDataCellRenderer(2,barRenderer);

        var sm = table.getSelectionModel();
        var num = new qx.ui.table.cellrenderer.Number();
        var format = this._numFormat = new qx.util.format.NumberFormat('en_US');
        num.setNumberFormat(format);
        tcm.setDataCellRenderer(1, num);

        sm.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);
        sm.addListener('changeSelection', this._onChangeSelection,this);
        var timer = this._timer = new qx.event.Timer(24 * 3600 * 1000);
        timer.addListener('interval', function() {
            this.reloadTable();
        },
        this);
        timer.stop();        
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
        cfg : {
            init     : null,
            apply    : 'reloadTable',
            nullable : true
        },
        /**
         * id of the current node
         */
        recId : {
            init     : null,
            nullable : true
        },
        /**
         * caption for the data
         */
        caption: {
            init: null,
            nullable: true,
            event: 'changeCaption'
        }

    },

    members : {
        _table : null,
        _numFormat : null,
        _timer : null,
        _barRenderer: null,
        /**
         * reload the table if all the required data is provided
         *
         * @return {void} 
         */
        reloadTable : function() {
            if (this.getCfg()) {
                var rpc = ep.data.Server.getInstance();
                var tm = this._table.getTableModel();                
                this.setViewMode('loading');
                var that = this;

                rpc.callAsyncSmart(function(ret) {
                    
                    if (ret.data && ret.data.length && ret.data[0].length ) {
                        that.setViewMode('ready');
                        that._numFormat.setPostfix(' '+ret.unit);
                        var rsb = that._table.getTableColumnModel().getBehavior();
                        var txtWidth = 0;
                        var numWidth = 0;
                        ret.data.forEach(function(row){                            
                            txtWidth = Math.max(txtWidth,String(row[0]).length)
                            numWidth = Math.max(numWidth,String(row[1]).length + ret.unit.length);
                            row[2] = row[1] = parseFloat(row[1]);
                                                        
                        });
                        rsb.setMaxWidth(0,Math.round(txtWidth * 7));
                        rsb.setWidth(0,'2*');
                        rsb.setMaxWidth(1,Math.round(numWidth * 10));
                        rsb.setWidth(1,'2*');
                        rsb.setWidth(2,'1*');
                        tm.setData(ret.data);
                        that.setCaption(ret.caption);
                    }
                    else {
                        tm.setData([]);
                        that.setViewMode('nodata');
                    }
                    if (ret.reload){
                        var timer = that._timer;
                        timer.setInterval(ret.reload*1000);
                        timer.restart();
                    }
                    that._barRenderer.reset();
                },
                'visualize', this.getInstance(), { recId: this.getRecId(), form: this.getCfg() });
            }
            else {
                this.setViewMode('nodata');
            }
        },
        _onChangeSelection: function(e) {
            var table = this._table;
            var sm = table.getSelectionModel();
            var tm = table.getTableModel();
            var tcm = table.getTableColumnModel();

            var selText = '';

            sm.iterateSelection(function(ind) {
                var cols = tcm.getVisibleColumns();
                selText += cols.map( function(col){ return tm.getValue(col,ind) }).join("\t") + "\n";
            },this);
            if (selText){
                ep.ui.CopyBuffer.getInstance().setBuffer(selText);
            }
        }
    }
});
