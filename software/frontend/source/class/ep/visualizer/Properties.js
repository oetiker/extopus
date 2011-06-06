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
        var scroller = new qx.ui.container.Scroll();
        this.setLayout(new qx.ui.layout.Grow());
        scroller.set({
            padding: 10
        });
        var pane = this._pane = new qx.ui.container.Composite().set({
            layout: new qx.ui.layout.Grid(5,5),
            padding: 10
        });
        scroller.add(pane);
        this.add(scroller);
        this.setArgs(args);
    },
    statics: {
        KEY: 'properties'
    },
    members: {
        _pane: null,
        _applyArgs: function(newArgs,oldArgs){
            var pane = this._pane;
            var labels = pane._removeAll();
            var row = 0;
            for (var key in  newArgs){
                 var l = (labels.pop() || new qx.ui.basic.Label()).set({ value: key + ': ', selectable: true});
                 var v = (labels.pop() || new qx.ui.basic.Label()).set({ value: newArgs[key], selectable: true});
                 pane.add(l,{row:row,column:0});
                 pane.add(v,{row:row,column:1});
                 row++;
            }
        }
    }    
});
