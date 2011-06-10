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
        _createVisualizer: function(viz){
            var control;
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
                    qx.dev.Debug.debugObject(viz,'Can not handle ');
                
            }
            return control;
        },
        _showVisualizers: function(vizList){
            var active = {};
            var cache = this.__pageCache;
            for (var i = 0; i< vizList.length;i++) {
                var viz = vizList[i];
                var key = viz.visualizer + ':' + viz.title;
                active[key] = true;
                var control = cache[key];
                if (control){
                    control.getChildControl('button').show();
                    control.setArgs(viz.arguments);                    
                }
                else {
                    control = this._createVisualizer(viz);
                    control.setUserData('key',key);
                    this.add(control);
                    control.addListenerOnce('breakout',this._onBreakOut,this);
                    cache[key] = control;
                }
                control.setUserData('caption',viz.caption);
            }
            for (var vizKey in cache){
                if (!active[vizKey]){
                    cache[vizKey].getChildControl('button').exclude();
                    if (this.isSelected(cache[vizKey])){                        
                        this.setSelection([this.getSelectables(true)[0]]);
                    }
                }
            }
        },
        _onBreakOut: function(e){
            var page = e.getData();         
            var el = page.getContainerElement().getDomElement();
            var width = qx.bom.element.Dimension.getWidth(el);
            var height = qx.bom.element.Dimension.getHeight(el)
   
            /// figure size and set on window
            this.remove(page);
            delete this.__pageCache[page.getUserData('key')];
            var win = new qx.ui.window.Window(page.getUserData('caption')).set({
                showMinimize: false,
                width: width,
                height: height
            });
            win.setLayout(new qx.ui.layout.Grow());
            page.show();
            page.remove
            win.open();
            win.maximize();
            win.add(page);            
            win.addListenerOnce('appear',function(e){
                win.center()
            },this);
            win.addListenerOnce('close',function(e){
                page.getButton().dispose();
                page.dispose();
                this.getApplicationRoot().remove(win);
                win.dispose();
            },this);
        }                        
    }    
});
