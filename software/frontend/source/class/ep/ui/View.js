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
    extend : qx.ui.core.Widget,
    /**
     * @param table {ep.ui.Table} table controling the view content
     */
    construct : function(table) {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.Grow());
        var tabView = this.__tabView = new qx.ui.tabview.TabView('top').set({ minHeight : 250 });
        tabView.hide();
        this._add(new ep.ui.Logo());
        this._add(tabView);
        this.__table = table;

        var sm = this.__selectionModel = table.getSelectionModel();
        sm.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);
        var tm = this.__tableModel = table.getTableModel();
        this.__columnModel = table.getTableColumnModel();

        var rpc = this.__rpc = ep.data.Server.getInstance();
        this.__multiMode = false;
        sm.addListener('changeSelection', this._onChangeSelection,this);

        this.__pageCache = {};
        this.__breakOutKids = {};
    },
    properties: {
        /**
         * List of Records selected in view table
         **/
        recIds: {
            init: [],
            event: 'changeRecIds'
        }
    },

    members : {
        __pageCache : null,
        __breakOutKids : null,
        __hideTimer : null,
        __tabView : null,
        __table : null,
        __selectedRows: null,
        __multiMode: null,
        __selectionModel: null,
        __columnModel: null,
        __tableModel: null,
        __rpc: null,

        /**
         * Create new a visualizer widget according to the given configuration.

         * @param viz {Map} visualizer configuration map
         * @return {Widget} visualizer widget
         */
        _createVisualizer : function(viz) {
            viz.arguments.recIds = this.getRecIds();
            var control = ep.visualizer.AbstractVisualizer.createVisualizer(viz,this);
            return new ep.ui.ViewPage(control);
        },


        /**
         * Show the appropriate visualizer for the seleced node in a tab view. The method will re-use existing visualizer
         * instances where possible.
         *
         * @param vizList {Array} visualizer config array
         * @return {void} 
         */
        _showVisualizers : function(vizList) {
            var active = {};
            var tabView = this.__tabView;
            if (this.__hideTimer) {
                this.__hideTimer.stop();
                this.__hideTimer = null;
            }
            if (!vizList || vizList.length == 0){
                tabView.hide();
                return;                
            }
            if (tabView.isHidden()) {
                tabView.show();
            }

            for (var kid in this.__breakOutKids) {
                if (!this.__breakOutKids[kid].isDisposed()) {
                    this.__breakOutKids[kid].set({
                        showClose    : true,
                        showMinimize : false
                    });
                    this.__breakOutKids[kid].getUserData('pageWidget').unhook();
                }
            }

            this.__breakOutKids = {};
            var cache = this.__pageCache;
            var bar = tabView.getChildControl('bar');
            var oldSelection = tabView.getSelection()[0];

            for (var i=0;i<vizList.length;i++){
                var viz = vizList[i];
                var instance = viz.instance;
                active[instance] = true;
                var control = cache[instance];

                if (control) {
                    control.getButton().set({
                        visibility : 'visible',
                        enabled    : true
                    });
                    viz.arguments.recIds = this.getRecIds();
                    control.getVisualizer().setArgs(viz.arguments);
                }
                else {
                    control = this._createVisualizer(viz);
                    tabView.add(control);
                    control.addListener('breakout', this._onBreakOut, this);
                    cache[instance] = control;
                }
                control.setUserData('position', i);
                var button = control.getButton();

                if (bar.indexOf(button) != i) {
                    bar.remove(button);
                    bar.addAt(button, i);
                }
            }

            var reselect = false;
            for (var instance in cache) {
                if (!active[instance]){
                    if (tabView.isSelected(cache[instance])) {
                       reselect = true;
                    }
                    cache[instance].getButton().set({
                        visibility : 'excluded',
                        enabled    : false
                    });
                }
            }
            if (reselect || tabView.getSelection()[0] !== oldSelection ){
                var list = tabView.getSelectables(false);
                var bar = tabView.getChildControl('bar');
                list.forEach(function(page){
                    var button = page.getButton();    
                    if (bar.indexOf(button) == 0){
                        tabView.setSelection([page]);
                    }
                });
            }


        },


        /**
         * Break out a visualizer tab into its own window.
         *
         * @param e {Event} breakOut event
         * @return {void} 
         */
        _onBreakOut : function(e) {
            var page = e.getData();
            var el = page.getContainerElement().getDomElement();
            var width = qx.bom.element.Dimension.getWidth(el);
            var height = qx.bom.element.Dimension.getHeight(el);
            var instance = page.getVisualizer().getInstance();
            var tabView = this.__tabView;

            /// figure size and set on window
            tabView.remove(page);
            delete this.__pageCache[instance];
            var viz = page.getVisualizer();
            var win = new qx.ui.window.Window(viz.getCaption()).set({
                showClose : false,
                width     : width,
                height    : height
            });
            var capListener = viz.addListener('changeCaption',function(e){win.setCaption(e.getData())},this);
            win.setUserData('pageWidget',page);
            this.__breakOutKids[instance] = win;
            win.setLayout(new qx.ui.layout.Grow());
            page.show();
            page.remove;
            win.open();
            win.maximize();
            win.add(page);

            win.addListenerOnce('appear', function(e) {
                win.center();
            }, this);

            win.addListenerOnce('close', function(e) {
                delete this.__breakOutKids[instance];
                page.getVisualizer().removeListenerById(capListener);
                page.getButton().dispose();
                page.dispose();
                this.getApplicationRoot().remove(win);
                win.dispose();
                
            },
            this);

            win.addListenerOnce('minimize', function(e) {
                win.remove(page);
                this.getApplicationRoot().remove(win);
                page.getVisualizer().removeListenerById(capListener);
                win.dispose();
                delete this.__breakOutKids[instance];
                tabView.add(page);
                tabView.setSelection([page]);
                var button = page.getButton();
                var bar = tabView.getChildControl('bar');
                var pos = page.getUserData('position');

                if (bar.indexOf(button) != pos) {
                    bar.remove(button);
                    bar.addAt(button, pos);
                }

                tabView.setSelection([ page ]);
                this.__pageCache[page.getVisualizer().getInstance()] = page;
            },
            this);
        },
        /**
         * As the selection in the table changes, update the selected RecordIds and activate the appropriate
         * visualizers.
         *
         * @param event {qx.event.type.Data} change selection event
         */
        _onChangeSelection: function(e) {
            var recIds = [];
            var tabView = this.__tabView;
            var sm = this.__selectionModel;
            var tm = this.__tableModel;
            var rpc = this.__rpc;
            var selText = '';
            var cc = tm.getColumnCount();
            sm.iterateSelection(function(ind) {
                recIds.push(tm.getValue(0, ind));
                var cols = this.__columnModel.getVisibleColumns();
                selText += cols.map( function(col){ return tm.getValue(col,ind) }).join("\t") + "\n";
            },this);
            if (selText){
                ep.ui.CopyBuffer.getInstance().setBuffer(selText);
            }
            if (recIds.length == 0){
                this.__hideTimer = qx.event.Timer.once(function() {
                    this.__hideTimer = null;
                    tabView.hide();
                },
                this, 200);
                return;
            }            

            if (recIds.length > 1){
                if (!this.__multiMode){
                    /* only pass one recId, as this only serves to determine the type of visualizer */
                    rpc.callAsyncSmart(qx.lang.Function.bind(this._showVisualizers, this), 'getVisualizers', 'multi', recIds[0]);
                    this.__multiMode = true;
                }
            }
            else {
                this.__multiMode = false;
                rpc.callAsyncSmart(qx.lang.Function.bind(this._showVisualizers, this), 'getVisualizers', 'single', recIds[0]);
            }
            this.setRecIds(recIds);
        }
    }
});
