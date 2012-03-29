/* ************************************************************************
   Copyright: 2012 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Show Data analysis page
**/
qx.Class.define("ep.visualizer.DirectData", {
    extend : ep.visualizer.AbstractVisualizer,

    /**
     * 
     * @param instance {String} unique key for visualizer
     * @param title {String} tab title
     * @param args  {Map} configuration arguments.
     * @param view  {Widget} pointer to the original selection view
     * @return {void} 
     *
     */
    construct : function(instance,title, args,view) {

        this.base(arguments, instance, title, args,view);
        this._setLayout(new qx.ui.layout.VBox(10));
        var titleContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox(8).set({ alignY : 'middle' }));
        if (!args.compact){
            this._add(titleContainer);
        }
        var form = this._cfgForm = new ep.ui.FormBar(args.form);
        titleContainer.add(form);
        titleContainer.add(new qx.ui.core.Spacer(20), { flex : 1 });
        var table = this._table = new ep.visualizer.data.DirectDataTable(instance);
        form.addListener('changeData',function(e){
            var d = e.getData();
            this._userCfg = d;
            table.setCfg(d);
            table.setRecId(this.getRecIds()[0]);
        },this);
        this.setArgs(args);
        table.addListener('changeCaption',function(e){this.setCaption(e.getData())},this);
        this._add(table, { flex : 1 });
    },

    statics : { KEY : 'directdata' },

    members : {
        _cfgForm: null,
        /**
         * Setup visualizer with new configuration
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _applyArgs : function(newArgs, oldArgs) {
            this.base(arguments, newArgs, oldArgs)
            this._cfgForm.setData(this._userCfg);
        }
    }
});
