/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Visualization widgets they are re-usable by calling .setArgs(args)
**/
qx.Class.define("ep.visualizer.AbstractVisualizer", {
    extend : qx.ui.tabview.Page,
    type: 'abstract',
    construct : function(title) {                
        this.base(arguments,this['tr'](title));
    },
    statics: {
        KEY: 'name'
    },
    properties: {
        args: {
            nullable: true,
            init: null,
            apply: '_applyArgs'
        }
    },
    members: {
        _applyArgs: function(newArgs,oldArgs){
            this.error('overwrite _applyArgs in the child object');
        }
    }
});
