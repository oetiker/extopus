/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Show page from monitoring System.
**/
qx.Class.define("ep.visualizer.Properties", {
    extend : ep.visualizer.AbstractVisualizer,
    construct : function(title,args) {
        this.base(arguments,title);
        this.set({
            layout: new qx.ui.layout.Grid(3,3),
            padding: 5
        });
        this.setArgs(args);
    },
    statics: {
        KEY: 'properties'
    },
    members: {
        _applyArgs: function(newArgs,oldArgs){
            var labels = this._removeAll();
            var row = 0;
            for (var key in  newArgs){
                 var l = (labels.pop() || new qx.ui.basic.Label()).set({ value: key + ': ', selectable: true});
                 var v = (labels.pop() || new qx.ui.basic.Label()).set({ value: newArgs[key], selectable: true});
                 this.add(l,{row:row,column:0});
                 this.add(v,{row:row,column:1});
                 row++;
            }
        }
    }    
});
