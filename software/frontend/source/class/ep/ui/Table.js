/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create a table according to the instructions provided.
 */
qx.Class.define("ep.ui.Table", {
    extend : qx.ui.table.Table,

    construct : function(tm,widths) {
        var tableOpts = {
            tableColumnModel : function(obj) {
                return new qx.ui.table.columnmodel.Resize(obj);
            }
        };
        this.base(arguments, tm, tableOpts);
        this.set({
            showCellFocusIndicator : false
        });
        // hide the first column as it contains the internal
        // id of the node
        var tcm = this.getTableColumnModel();
        tcm.setColumnVisible(0,false);
        if (widths){
            var resizeBehavior = tcm.getBehavior(); 
            for (var i=0;i<widths.length;i++){
                resizeBehavior.setWidth(i, String(widths[i]) + "*");    
            }
        }
        this.getDataRowRenderer().setHighlightFocusRow(false);
        
    }


});
