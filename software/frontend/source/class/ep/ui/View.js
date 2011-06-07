/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Show page from monitoring System.
**/
qx.Class.define("ep.ui.View", {
    extend : qx.ui.tabview.TabView,
    construct : function(table) {                
        this.base(arguments,'top');
        this.set({
            minHeight: 250
        });
        var sm = table.getSelectionModel();
        sm.setSelectionMode(qx.ui.table.selection.Model.SINGLE_SELECTION);
        var tm = table.getTableModel();
        var rpc=ep.data.Server.getInstance();
        sm.addListener('changeSelection',function(e){
            sm.iterateSelection(function(ind){
                // this will only iterate once since we are in single selection 
                // mode ... the first column holds the nodeId               
                rpc.callAsyncSmart(qx.lang.Function.bind(this._showVisualizers,this),'getVisualizers',tm.getValue(0,ind));
            },this);
        },this);        
        this.__pageCache = {};
    },
    members: {
        __pageCache: null,
        _showVisualizers: function(vizList){
            var activeVisualizers = {};
            for (var i = 0; i< vizList.length;i++) {
                var viz = vizList[i];
                var key = viz.visualizer + ':' + viz.title;
                activeVisualizers[key] = true;
                var page = this.__pageCache[key];
                var control;
                if (page){
                    control = page.widget;
                    control.setArgs(viz.arguments);
                    if (!page.included){
                        page.included = true;
                        this.add(control);
                    }
                }
                else {
                    switch(viz.visualizer){
                    case ep.visualizer.Chart.KEY:
                        control = new ep.visualizer.Chart(viz.title,viz.arguments);
                        break;
                    case ep.visualizer.IFrame.KEY:
                        control = new ep.visualizer.IFrame(viz.title,viz.arguments);
                        break;
                    case ep.visualizer.Properties.KEY:
                        control = new ep.visualizer.Properties(viz.title,viz.arguments);
                        break;
                    case ep.visualizer.Data.KEY:
                        control = new ep.visualizer.Data(viz.title,viz.arguments);
                        break;
                    default: 
                        qx.dev.Debug.debugObject(vizList[i],'Can not handle ');
                    }
                    this.add(control);
                    this.__pageCache[key] = { widget: control, included: true };
                }
            }
            for (var vizKey in this.__pageCache){
                if (!activeVisualizers[vizKey] && this.__pageCache[vizKey].included){
                    this.remove(this.__pageCache[vizKey].widget);
                    this.__pageCache[vizKey].included = false;
                }
            }
        }
    }    
});
