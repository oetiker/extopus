/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Show page from monitoring System.
 */
qx.Class.define("ep.ui.View", {
    extend : qx.ui.tabview.TabView,
    construct : function(table) {                
        this.base(arguments,'left');
        var sm = table.getSelectionModel();
        sm.setSelectionMode(qx.ui.table.selection.Model.SINGLE_SELECTION);
        var tm = table.getTableModel();
        var rpc=ep.data.Server.getInstance();
        sm.addListener('changeSelection',function(e){
            var kids = this.getChildren();
            // kids is not a copy but the actual kids array ... it shrinks as the
            // kids are removed.
            while (kids.length > 0){
                this.remove(kids[0])
            };
            sm.iterateSelection(function(ind){
                // this will only iterate once since we are in single selection 
                // mode ... the first column holds the nodeId               
                rpc.callAsyncSmart(qx.lang.Function.bind(this._showVisualizers,this),'getVisualizers',tm.getValue(0,ind));
            },this);
        },this);
    },
    members: {
        _showVisualizers: function(vizList){
            for (var i = 0; i< vizList.length;i++) {
                var viz = vizList[i];
                if (! viz.arguments ){
                    this.debug('skipping empty viz');
                    continue;
                }
                var page = null;
                switch(viz.visualizer){
                    case 'iframe':
                        if (!page){
                            var tab = new qx.ui.tabview.Page(viz.arguments.title).set({
                                layout: new qx.ui.layout.Grow()
                            });
                            this.add(tab);
                            page = new qx.ui.embed.ThemedIframe();
                            tab.add(page);
                        };
                        page.setSource(viz.arguments.src);
                        break;
                    case 'plain':
                        if (!page){
                            var tab = new qx.ui.tabview.Page(this.tr('Properies')).set({
                                layout: new qx.ui.layout.Grow()
                            });
                            this.add(tab);
                            page = new qx.ui.container.Composite().set({
                                layout: new qx.ui.layout.Grid(3,3),
                                padding: 5
                            });                            
                            tab.add(page);
                        };
                        var row = 0;
                        for (var key in  viz.arguments){
                            var l = new qx.ui.basic.Label(key + ': ');
                            var v = new qx.ui.basic.Label(viz.arguments[key]);
                            page.add(l,{row:row,column:0});
                            page.add(v,{row:row,column:1});
                            row++;
                        }
                        break;
                        
                        break;
                    default: 
                        qx.dev.Debug.debugObject(vizList[i],'Problem with');                                            
                }
                
            }
                
        }
    }    
});
