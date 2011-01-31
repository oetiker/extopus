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
    extend : qx.ui.core.Widget,
    construct : function() {
        this.base(arguments);
        var grid = new qx.ui.layout.Grid(0,0);
        grid.setColumnFlex(0,1);
        grid.setRowFlex(1,1);
        this._setLayout(grid);
        this._createChildControl('search-box');
        this._createChildControl('table');
    },
    properties: {
       /** Appearance of the widget */
        appearance : {
            refine : true,
            init   : "eptable"
        }
    },
    members: {
        _createChildControlImpl : function(id) {
            var control;
            switch(id)
            {
                case "table":
                    var model = ep.data.NodeTableModel.getInstance();
                    control = new qx.ui.table.Table(model).set({
                        showCellFocusIndicator : false                    
                    });
                    control.getDataRowRenderer().setHighlightFocusRow(false);
                    this._add(control,{row:1,column:0});
                    break;
                case "search-box":
                    control = new qx.ui.form.TextField().set({
                        placeholder: this.tr('search ...')
                    });
                    this._add(control,{row:0,column:0});
                    control.addListener("changeValue",this._setSearch,this);
                    break;
            }
            return control || this.base(arguments, id);
        },
        _setSearch: function(e){
            var value = e.getData();
            var tree = this.getChildControl('tree').getDataModel().clearData();
            this._addNodeKids();
            ep.data.NodeTableModel.getInstance().setSearch(value);
        }
    }
});
