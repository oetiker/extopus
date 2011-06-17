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
            padding: 10,
            width: 400
        });
        var l = this._label = new qx.ui.basic.Label().set({
            rich: true,
            padding: 10,
            selectable: true
        });
        scroller.add(l);
        this.add(scroller);
        this.setArgs(args);
    },
    statics: {
        KEY: 'properties'
    },
    members: {
        _label: null,
        _applyArgs: function(newArgs,oldArgs){
            var l = this._label;
            var data = '<table>';
            newArgs.map(function(row){
                data += '<tr><td>'+qx.bom.String.escape(row[0])+':&nbsp;</td><td>'+qx.bom.String.escape(row[1])+'</td></tr>';
            });
            data += '</table>';
            this._label.setValue(data);
        }
    }    
});
