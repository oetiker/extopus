/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create a table according to the instructions provided.
 */
qx.Class.define("ep.visualizer.DataTable", {
    extend : ep.ui.LoadingBox,
    construct : function(instance,columns,widths,units) {
        this.setInstance(instance);
        var tm = this.__model = new qx.ui.table.model.Simple().set({
            columns: columns
        });
        var tableOpts = {
            tableColumnModel : function(obj) {
                return new qx.ui.table.columnmodel.Resize(obj);
            }
        };
        var table = new qx.ui.table.Table(tm,tableOpts).set({
            allowShrinkX: true,
            allowShrinkY: true,
            allowGrowX: true,
            allowGrowY: true
        });
        var tcm = table.getTableColumnModel();
        var resizeBehavior = tcm.getBehavior();
        for (var i=0;i<columns.length;i++){
            if (widths[i]){
                resizeBehavior.setWidth(i,String(widths[i]) + '*');
            }
            if (units[i]){
                var num = new qx.ui.table.cellrenderer.Number();
                var format = new qx.util.format.NumberFormat('en_US').set({
                    postfix: ' '+units[i]
                });
                num.setNumberFormat(format);
                tcm.setDataCellRenderer(i,num);
            }
        }
        this.base(arguments,table);
    },
    properties: {
        instance: {
            init: null,
            nullable: true
        },
        treeUrl: {
            init: null,
            nullable: true
        },
        hash: {
            init: null,
            nullable: true
        },
        nodeId: {
            init: null,
            apply: '_reloadTable',
            nullable: true
        },
        interval: {
            init: null,
            apply: '_reloadTable',
            nullable: true
        },
        count: {
            init: null,
            check: 'Integer',
            apply: '_reloadTable',
            nullable: true
        },        
        endDate: {
            init: null,
            check: 'Date',
            apply: '_reloadTable',
            nullable: true
        }
    },
    members: {
        __model: null,
        _reloadTable: function (){
            if (
                this.getInterval()
                && this.getCount()
                && this.getTreeUrl()
                && this.getNodeId()
                && this.getHash()
            ){
                var rpc=ep.data.Server.getInstance();
                var date = Math.round(new Date().getTime()/1000);
                if (this.getEndDate()){
                    date = Math.round(this.getEndDate().getTime()/1000);
                }
                var tm = this.__model;
                this.setViewMode('loading');
                var that = this;
                rpc.callAsyncSmart(function(ret){
                    if (ret.status){                
                        that.setViewMode('ready');
                        tm.setData(ret.data);
                    }
                    else {
                        that.setViewMode('nodata');
                        tm.setData([]);
                    }
                },'visualize',this.getInstance(),{
                    interval: this.getInterval(),
                    endDate: date,
                    count: this.getCount(),
                    treeUrl: this.getTreeUrl(),
                    nodeId: this.getNodeId(),
                    hash: this.getHash()
                });
            }
            else {
                this.setViewMode('nodata');
            }
        }
    }
});
