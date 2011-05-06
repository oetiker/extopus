/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * The window for the browser side representation of a plugin instance.
 */
qx.Class.define("ep.ui.SearchView", {
    extend : qx.ui.core.Widget,
    construct : function() {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.VBox());
        this._createSearchBox();
        this.__vPane = new qx.ui.splitpane.Pane("vertical");
        this._add(this.__vPane,{flex: 1});
        var rpc=ep.data.Server.getInstance();
        var that = this;
        rpc.callAsyncSmart(function(ret){
            var tm = ep.data.NodeTableModel.getInstance();
            tm.setColumns(ret.names,ret.ids);
            that._createTable();
            that._createView();
        },'getTableColumnDef','search');
    },
    properties: {
        searchBox: {},
        table: {},
        view: {}
    },
    members: {
        __vPane: null,
        _createSearchBox : function() {
            var control = new qx.ui.form.TextField().set({
                placeholder: this.tr('search ...'),
                enabled: false
            });
            this._add(control);
            control.addListener("changeValue",this._setSearch,this);
            this.setSearchBox(control);
        },
        _createTable: function(){
            var model = ep.data.NodeTableModel.getInstance();
            var control = new ep.ui.Table(model);
            this.__vPane.add(control,1);
            this.getSearchBox().setEnabled(true);
            this.setTable(control);
        },
        _createView: function(){
            var control = new ep.ui.View();
            this.__vPane.add(control,3);
            this.setView(control);
        },
        _setSearch: function(e){
            var value = e.getData();
            ep.data.NodeTableModel.getInstance().setSearch(value);
        }
    }
});
