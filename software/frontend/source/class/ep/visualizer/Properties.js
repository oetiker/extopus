/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Show node properties.
 **/
qx.Class.define("ep.visualizer.Properties", {
    extend : ep.visualizer.AbstractVisualizer,

    /**
     * Setup the Chart view. The arguments map must look like this:
     * 
     * <pre>
     * [ [ key, value ], [ ... ] ]
     * </pre>
     * 
     * @param title {String} tab title
     * @param args  {Map} configuration arguments.
     * @return {void} 
     *
     */
    construct : function(instance,title, args, view) {
        this.base(arguments, instance,title, args, view);
        var scroller = new qx.ui.container.Scroll();
        this._setLayout(new qx.ui.layout.Grow());

        scroller.set({
            padding : 10,
            width   : 400
        });

        var l = this._label = new qx.ui.basic.Label().set({
            rich       : true,
            padding    : 10,
            selectable : true
        });

        scroller.add(l);
        this._add(scroller);
        this.setArgs(args);
    },

    statics : { KEY : 'properties' },

    members : {
        _label : null,


        /**
         * Update the view content.
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _applyArgs : function(newArgs, oldArgs) {
            var l = this._label;
            var data = '<table>';

            newArgs.forEach(function(row) {
                data += '<tr><td>' + qx.bom.String.escape(row[0]) + ':&nbsp;</td><td>' + qx.bom.String.escape(row[1]) + '</td></tr>';
            });

            data += '</table>';
            l.setValue(data);
            this.base(arguments, newArgs, oldArgs);
        }
    }
});
