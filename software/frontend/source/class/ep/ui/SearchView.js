/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * The searchView with search box, table and view area
 */
qx.Class.define("ep.ui.SearchView", {
    extend : qx.ui.core.Widget,

    /**
     * @param colDef {Map} column definition with names and ids propperties
     */
    construct : function(colDef) {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.VBox());
        this._createSearchBox();
        this.__vPane = new qx.ui.splitpane.Pane("vertical");
        this._add(this.__vPane, { flex : 1 });
        var tm = ep.data.NodeTableModel.getInstance();
        tm.setColumns(colDef.names, colDef.ids);
        this._createTable(colDef.widths);
        this._createView();
    },

    members : {
        __vPane : null,
        __searchBox: null,
        __table: null,

        /**
         * Setup the search Text field
         *
         * @return {void} 
         */
        _createSearchBox : function() {
            var control = new qx.ui.form.TextField().set({
                placeholder : this.tr('search ...'),
                enabled     : false
            });

            this._add(control);
            control.addListener("changeValue", this._setSearch, this);
            this.__searchBox = control;
        },


        /**
         * Create the table widget.
         *
         * @param widths {var} the column widths for the table
         * @return {void} 
         */
        _createTable : function(widths) {
            var model = ep.data.NodeTableModel.getInstance();
            var control = new ep.ui.Table(model, widths);
            this.__vPane.add(control, 1);
            this.__searchBox.setEnabled(true);
            this.__table = control;
        },


        /**
         * Create the view widget
         *
         * @return {void} 
         */
        _createView : function() {
            var control = new ep.ui.View(this.__table);
            this.__vPane.add(control, 3);
        },


        /**
         * Set the search value as data is entered in the search textbox
         *
         * @param e {Event} change event
         * @return {void} 
         */
        _setSearch : function(e) {
            var value = e.getData();
            this.__table.getSelectionModel().resetSelection();
            ep.data.NodeTableModel.getInstance().setSearch(value);
        }
    }
});
