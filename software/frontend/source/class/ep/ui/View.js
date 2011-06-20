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

    construct : function(table) {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.Grow());
        var tabView = this.__tabView = new qx.ui.tabview.TabView('top').set({ minHeight : 250 });
        tabView.hide();
        this._add(new ep.ui.Logo());
        this._add(tabView);

        var sm = table.getSelectionModel();
        sm.setSelectionMode(qx.ui.table.selection.Model.SINGLE_SELECTION);
        var tm = table.getTableModel();
        var rpc = ep.data.Server.getInstance();

        sm.addListener('changeSelection', function(e) {
            var empty = true;

            sm.iterateSelection(function(ind) {
                // this will only iterate once since we are in single selection
                // mode ... the first column holds the nodeId
                rpc.callAsyncSmart(qx.lang.Function.bind(this._showVisualizers, this), 'getVisualizers', tm.getValue(0, ind));
                empty = false;
            },
            this);

            if (empty) {
                this.__hideTimer = qx.event.Timer.once(function() {
                    this.__hideTimer = null;
                    tabView.hide();
                },
                this, 200);
            }
        },
        this);

        this.__pageCache = {};
        this.__breakOutKids = {};
    },

    members : {
        __pageCache : null,
        __breakOutKids : null,
        __hideTimer : null,
        __tabView : null,


        /**
         * TODOC
         *
         * @param viz {var} TODOC
         * @return {var} TODOC
         */
        _createVisualizer : function(viz) {
            var control;

            switch(viz.visualizer)
            {
                case ep.visualizer.Chart.KEY:
                    control = new ep.visualizer.Chart(viz.title, viz.arguments);
                    break;

                case ep.visualizer.IFrame.KEY:
                    control = new ep.visualizer.IFrame(viz.title, viz.arguments);
                    break;

                case ep.visualizer.Properties.KEY:
                    control = new ep.visualizer.Properties(viz.title, viz.arguments);
                    break;

                case ep.visualizer.Data.KEY:
                    control = new ep.visualizer.Data(viz.title, viz.arguments);
                    break;

                default:
                    qx.dev.Debug.debugObject(viz, 'Can not handle ');
            }

            return control;
        },


        /**
         * TODOC
         *
         * @param vizList {var} TODOC
         * @return {void} 
         */
        _showVisualizers : function(vizList) {
            var active = {};
            var tabView = this.__tabView;

            if (this.__hideTimer) {
                this.__hideTimer.stop();
                this.__hideTimer = null;
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

                    control.setArgs(viz.arguments);
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

            for (var vizKey in cache) {
                if (!active[vizKey]) {
                    cache[vizKey].getButton().set({
                        visibility : 'excluded',
                        enabled    : false
                    });

                    if (tabView.isSelected(cache[vizKey])) {
                        tabView.setSelection([ tabView.getSelectables(true)[0] ]);
                    }
                }
            }
        },


        /**
         * TODOC
         *
         * @param e {Event} TODOC
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
        }
    }
});