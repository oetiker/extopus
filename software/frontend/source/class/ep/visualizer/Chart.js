/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Show a <b>chart</b> image from the monitoring System.
 */
qx.Class.define("ep.visualizer.Chart", {
    extend : ep.visualizer.AbstractVisualizer,

    /**
     * Setup the Chart view. The arguments map must look like this:
     * 
     * <pre code='javascript'>
     * {
     *    views: [ { title: 'x', src: 'view/url' }, { ... } ],
     *    template: '<html>...</html>'
     * }
     * </pre>
     * 
     * @param title {String} tab title
     * @param args  {Map} configuration arguments.
     * @return {void} 
     *
     */

    construct : function(title, args, view) {
        this.base(arguments, title, args, view);
        this._vizKey = this.self(arguments).KEY;
        this._setLayout(new qx.ui.layout.VBox(10));
        var titleContainer = this.__titleContainer = new qx.ui.container.Composite(
            new qx.ui.layout.HBox(8).set({ alignY : 'middle' })
        );
        this._add(titleContainer);

        // the chart
        var chart = this.__chart = new ep.visualizer.chart.Image();
        this._add(chart, { flex : 1 });
        var form = this._cfgForm = new ep.ui.FormBar([
            {
                key: 'view',
                widget: 'selectBox',                
                set: {
                    maxListHeight: null,
                    maxWidth      : 600,
                    width         : 400,
                    minWidth      : 250
                }
                
            },
            {
                key: 'timeRange',
                widget: 'selectBox',
                set: {
                    width: 100
                },
                cfg : {
                    structure : [ 
                        { title : '1 Day',    key : 24 * 3600          },
                        { title : '2 Days',   key : 2 * 24 * 3600      },
                        { title : '1 Week',   key : 7 * 24 * 3600      },  
                        { title : '1 Month',  key : 31 * 24 * 3600     },  
                        { title : '3 Months', key : 3 * 31 * 24 * 3600 },  
                        { title : '6 Months', key : 6 * 31 * 24 * 3600 },  
                        { title : '1 Year',   key : 366 * 24 * 3600    },  
                        { title : '2 Year',   key : 2 * 366 * 24 * 3600}
                    ]
                }
            },
            {
                key: 'endTime',
                widget: 'date',
                label: 'End'
            },
            {
                key: 'maxInterval',
                widget: 'selectBox',
                set: {
                    width: 100
                },
                cfg : {
                    structure : [ 
                        { title : 'no Max',     key : 0                  },
                        { title : '1 Hour Max', key : 3600               },
                        { title : '6 Hour Max', key : 6 * 3600           },
                        { title : '1 Day Max',  key : 24 * 3600          }
                    ]
                }
            }
        ]);
        titleContainer.add(form);
        titleContainer.add(new qx.ui.core.Spacer(10), { flex : 1 });

        form.addListener('changeData',this._updateChart,this);

        var menu = new qx.ui.menu.Menu();

        var pdfButton = new qx.ui.menu.Button(this.tr('Save PDF'), "icon/16/actions/document-save.png");
        var printButton = this.__printBtn = new qx.ui.menu.Button(this.tr('Print'), "icon/16/actions/document-print.png");

        // add execute listeners
        pdfButton.addListener("execute", this._downloadPdf, this);
        printButton.addListener("execute", this._popupPrintPage, this);

        // add buttons to menu
        menu.add(pdfButton);
        menu.add(printButton);

        var menuButton = new qx.ui.form.MenuButton(this.tr('File'), null, menu);

        titleContainer.add(menuButton);
        this.setArgs(args);
    },

    statics : { 
        /**
         * The name of the visualizer is <code>chart</code>
         */
        KEY : 'chart' 
    },

    members : {
        __titleContainer: null,
        __viewSelector : null,
        __printBtn : null,
        __chart : null,
        __template : null,
        __urlArray : null,

        /**
         * Update Chart Event Handler
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _updateChart: function(e){
            var d = e.getData();
            var c = this.__chart;
            if (d.view == null){
                return;
            }
            this._userCfg = d;
            this.__titleContainer.setEnabled(true);
            c.setBaseUrl(this.__urlArray[d.view]);
            c.setTimeRange(d.timeRange);
            c.setEndTime(/^\d+$/.test(String(d.endTime)) ? parseInt(d.endTime) : null);
            c.setMaxInterval(d.maxInterval);            
        },
        /**
         * Setup the Chart view.
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _applyArgs : function(newArgs, oldArgs) {
            var v = newArgs.views || [];
            var urlArray = this.__urlArray = [];
            var sb = [];
            for (var i=0;i<v.length;i++){
                urlArray[i] = v[i].src;
                sb.push({title: v[i].title, key: i});
            }
            if (sb.length == 0){
                this.__titleContainer.setEnabled(false);
            }
            var cfg = this._userCfg;
            this._cfgForm.setSelectBoxData('view',sb );
            this.__template = newArgs.template;            
            this.base(arguments, newArgs, oldArgs);
            this._cfgForm.setData(cfg);
        },


        /**
         * Start the download of the pdf for the current chart
         *
         * @return {void} 
         */
        _downloadPdf : function() {
            var chart = this.__chart;
            var end = chart.getEndTime() || Math.round(new Date().getTime() / 1000);
            var start = end - chart.getTimeRange();
            var baseUrl = chart.getBaseUrl();
            var url = baseUrl + '&width=1000&height=500&start=' + start + '&end=' + end + '&format=.pdf';
            var win = qx.bom.Window.open(url, '_blank');

            qx.bom.Event.addNativeListener(win, 'load', function(e) {
                var body = qx.dom.Node.getBodyElement(win);
                var doc = qx.dom.Node.getDocumentElement(win);

                /* if the window is empty, then it got opened externally */

                if ((doc && qx.dom.Hierarchy.isEmpty(doc)) || (body && qx.dom.Hierarchy.isEmpty(body))) {
                    win.close();
                }
            });
        },


        /**
         * add bits to the template only available in the frontend. Currently to the following tags are supported:
         *
         * <ul>
         * <li><b>@@SRC@@</b> the src for loading the chart image</li>
         * <li><b>@@SRC@@</b> the src for loading the chart image</li>
         * <li><b>@@START(x)@@</b> start time of the graph with x being an ISO time spec</li>
         * <li><b>@@END(x)@@</b> end time of the graph with x being an ISO time spec</li>
         * </ul>
         * 
         * @return {String} the template with @@X@@ replaced.
         */
        _fillTemplate : function() {
            var chart = this.__chart;
            var end = chart.getEndTime() || Math.round(new Date().getTime() / 1000);
            var start = end - chart.getTimeRange();
            var view = this.__viewSelector.getSelection();

            var map = {
                'SRC' : function() {
                    return chart.getBaseUrl() + '&width=800&height=600&start=' + start + '&end=' + end + '&format=.png';
                },

                // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_function_as_a_parameter
                'START\\(([^)]+)\\)' : function(str, pattern) {
                    var fmt = new qx.util.format.DateFormat(pattern);
                    return fmt.format(new Date(start * 1000));
                },

                'END\\(([^)]+)\\)' : function(str, pattern) {
                    var fmt = new qx.util.format.DateFormat(pattern);
                    return fmt.format(new Date(end * 1000));
                },

                'VIEW' : function() {
                    return view.getItem(0).getTitle();
                }
            };

            var input = this.__template;

            for (var key in map) {
                var rx = new RegExp('@@' + key + '@@', 'g');
                input = input.replace(rx, map[key]);
            }

            return input;
        },

        
        /**
         * Pop open the print window and start the print dialog.
         *
         * @return {void} 
         */
        _popupPrintPage : function() {
            var win = qx.bom.Window.open("about:blank", '_blank', {
                scrollbars : true,
                width      : 900,
                height     : 600
            });

            win.document.write(this._fillTemplate());
            // wait for the image to load before printing ... 
            qx.event.Timer.once(function() { this.stop(); this.print(); },win, 500);
        }
    }
});
