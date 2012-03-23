/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create a table with the given table model and relative column widths.
 */
qx.Class.define("ep.ui.Table", {
    extend : qx.ui.table.Table,
    /**
     * @param tm {qx.ui.table.Model} table model
     * @param widths {Array} relative column widths
     */
    construct : function(tm, widths,props) {
        var tableOpts = {
            tableColumnModel : function(obj) {
                return new qx.ui.table.columnmodel.Resize(obj);
            }
        };

        this.base(arguments, tm, tableOpts);
        this.set({ 
            showCellFocusIndicator : false,
            statusBarVisible: false 
        });
        
        // hide the first column as it contains the internal
        // id of the node
        var tcm = this.getTableColumnModel();
        tcm.setColumnVisible(0, false);
        // set initial visiblity        
        if (props){
            for (var i = 0;i<props.length;i++){          
                if (props[i] == 'H'){
                    tcm.setColumnVisible(i+1, false);
                }
            }
        }
        if (widths) {
            var resizeBehavior = tcm.getBehavior();

            for (var i=0; i<widths.length; i++) {
                resizeBehavior.setWidth(i, String(widths[i]) + "*");
            }
        }

        this.getDataRowRenderer().setHighlightFocusRow(false);
    },
    members: {
        getSelectedRecordIds: function () {
            var sm = this.getSelectionModel();
            var tm = this.getTableModel();
            var recIds = [];
            sm.iterateSelection(function(ind) {
                recIds.push(tm.getValue(0, ind));
            },this);
            return recIds;
        }
    }
});
