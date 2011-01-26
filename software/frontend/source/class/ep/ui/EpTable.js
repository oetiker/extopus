/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * The window for the browser side representation of a plugin instance.
 */
qx.Class.define("ep.ui.EpTable", {
    extend : qx.ui.table.Table,
    construct : function() {
        var model = ep.data.NodeTableModel.getInstance();
        this.base(arguments,model);
        this.set({
            showCellFocusIndicator : false
        });
        this.getDataRowRenderer().setHighlightFocusRow(false);
    }
});
