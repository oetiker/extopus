/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * A simple iFrame. Loads the src property of the args map
 **/
qx.Class.define("ep.visualizer.IFrame", {
    extend : ep.visualizer.AbstractVisualizer,
    /**
     * Setup the Iframe view. The arguments map must look like this:
     * 
     * <pre code='javascript'>
     * {
     *    src: 'url/to/request'
     * }
     * </pre>
     * 
     * @param title {String} tab title
     * @param args  {Map} configuration arguments.
     * @return {void} 
     *
     */

    construct : function(title, args, view) {
        this.base(arguments, title, args, view);
        this._vizKey = this.self(arguments).KEY;
        this.set({ layout : new qx.ui.layout.Grow() });
        this.__iFrame = new qx.ui.embed.ThemedIframe();
        this.add(this.__iFrame);
        this.setArgs(args);
    },

    statics : { KEY : 'iframe' },

    members : {
        __iFrame : null,


        /**
         * Configure the Iframe
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _applyArgs : function(newArgs, oldArgs) {
            this.__iFrame.setSource(newArgs.src);
            this.base(arguments, newArgs, oldArgs);                 
        }
    }
});
