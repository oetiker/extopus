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
        this.__copyBox = new qx.ui.form.TextArea().set({
            width: 100,
            height: 100
        });
        this.getApplicationRoot().add(this.__copyBox,{top:-120,left: -120});


        var sm = this.__selectionModel = table.getSelectionModel();
        sm.setSelectionMode(qx.ui.table.selection.Model.MULTIPLE_INTERVAL_SELECTION);
        var tm = this.__tableModel = table.getTableModel();
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
        __tableModel: null,
        __rpc: null,

        /**
         * Create new a visualizer widget according to the given configuration. At first glance the configuration
         * map has a <code>title</code>, <code>caption</code> and <code>arguments</code> property.
         *
         * @param viz {Map} visualizer configuration map
         * @return {Widget} visualizer widget
         */
        _createVisualizer : function(viz) {
            viz.arguments.recIds = this.getRecIds();
            var control = ep.visualizer.AbstractVisualizer.createVisualizer(viz.visualizer,viz.title, viz.arguments,this);
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
                    /* allow the kid to disentagle itself */
                    this.__breakOutKids[kid].getUserData('pageWidget').onUnhook();
                }
            }

            this.__breakOutKids = {};
            var cache = this.__pageCache;
            var bar = tabView.getChildControl('bar');

            for (var i=0; i<vizList.length; i++) {
                var viz = vizList[i];
                var key = viz.visualizer + ':' + viz.title;
                active[key] = true;
                var control = cache[key];

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
                    control.setUserData('key', key);
                    tabView.add(control);
                    control.addListener('breakout', this._onBreakOut, this);
                    cache[key] = control;
                }
                control.setUserData('caption', viz.caption);
                control.setUserData('position', i);
                var button = control.getButton();

                if (bar.indexOf(button) != i) {
                    bar.remove(button);
                    bar.addAt(button, i);
                }
            }

            var reselect = false;
            for (var vizKey in cache) {
                if (!active[vizKey]) {
                    if (tabView.isSelected(cache[vizKey])) {
                        reselect = true;
                    }
                    cache[vizKey].getButton().set({
                        visibility : 'excluded',
                        enabled    : false
                    });
                }
            }
            if (reselect){
                tabView.setSelection([ tabView.getSelectables(false)[0] ]);
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
            var key = page.getUserData('key');
            var tabView = this.__tabView;

            /// figure size and set on window
            tabView.remove(page);
            delete this.__pageCache[key];

            var win = new qx.ui.window.Window(page.getUserData('caption')).set({
                showClose : false,
                width     : width,
                height    : height
            });
            win.setUserData('pageWidget',page);
            this.__breakOutKids[key] = win;
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
                delete this.__breakOutKids[key];
                page.getButton().dispose();
                page.dispose();
                this.getApplicationRoot().remove(win);
                win.dispose();
            },
            this);

            win.addListenerOnce('minimize', function(e) {
                win.remove(page);
                this.getApplicationRoot().remove(win);
                win.dispose();

                delete this.__breakOutKids[key];
                tabView.add(page);
                var button = page.getButton();
                var bar = tabView.getChildControl('bar');
                var pos = page.getUserData('position');

                if (bar.indexOf(button) != pos) {
                    bar.remove(button);
                    bar.addAt(button, pos);
                }

                tabView.setSelection([ page ]);
                this.__pageCache[page.getUserData('key')] = page;
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

            var sm = this.__selectionModel;
            var tm = this.__tableModel;
            var rpc = this.__rpc;
            var selText = '';
            var cc = tm.getColumnCount();
            sm.iterateSelection(function(ind) {
                recIds.push(tm.getValue(0, ind));
                for (var col = 1; col < cc ; col++) {
                    selText += tm.getValue(col,ind) + (col < cc ? "\t" : "\n");
                }
            },this);
            if (selText){
                this.__copyBox.setValue(selText);
                this.__copyBox.focus();
                this.__copyBox.selectAllText();
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
