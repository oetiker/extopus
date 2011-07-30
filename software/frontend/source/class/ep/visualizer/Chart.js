/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/* ***************
#asset(qx/icon/${qx.icontheme}/16/actions/document-save.png)
#asset(qx/icon/${qx.icontheme}/16/actions/document-print.png)
*************** */

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

    construct : function(title, args) {
        this.base(arguments, title);
        this.set({ layout : new qx.ui.layout.VBox(10) });
        var titleContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox(8).set({ alignY : 'middle' }));
        this.add(titleContainer);

        // the chart
        var chart = this.__chart = new ep.ui.ChartImage();
        this.add(chart, { flex : 1 });

        // view selector
        var dummyModel = qx.data.marshal.Json.createModel([ { title : '' } ]);

        var viewSelector = this.__viewSelector = new qx.ui.form.VirtualSelectBox(dummyModel).set({
            labelPath     : 'title',
            maxWidth      : 600,
            width         : 400,
            minWidth      : 250,
            maxListHeight : null
        });

        titleContainer.add(viewSelector, { flex : 10 });
        var viewSelection = viewSelector.getSelection();

        viewSelection.addListener("change", function(e) {
            var item = viewSelection.getItem(0);

            if (item == null) {
                chart.setBaseUrl(null);
                titleContainer.setEnabled(false);
                this.__printBtn.setEnabled(false);
                chart.setViewMode('nodata');
            }
            else {
                var url = item.getSrc();
                titleContainer.setEnabled(true);
                this.__printBtn.setEnabled(this.__template != null);
                chart.setBaseUrl(url);
            }
        },
        this);

        // time span
        var timeSpan = [ {
            l : '1 Day',
            v : 24 * 3600
        },
        {
            l : '2 Days',
            v : 2 * 24 * 3600
        },
        {
            l : '1 Week',
            v : 7 * 24 * 3600
        },
        {
            l : '1 Month',
            v : 31 * 24 * 3600
        },
        {
            l : '3 Months',
            v : 3 * 31 * 24 * 3600
        },
        {
            l : '6 Months',
            v : 3 * 31 * 24 * 3600
        },
        {
            l : '1 Year',
            v : 366 * 24 * 3600
        },
        {
            l : '2 Year',
            v : 2 * 366 * 24 * 3600
        } ];
        console.log(timeSpan);
        var timeSpanModel = qx.data.marshal.Json.createModel(timeSpan);

        var timeSpanSelector = new qx.ui.form.VirtualSelectBox(timeSpanModel).set({
            labelPath     : 'l',
            maxListHeight : null,
            width         : 100
        });

        var timeSpanSelection = timeSpanSelector.getSelection();

        timeSpanSelection.addListener("change", function(e) {
            chart.setTimeRange(timeSpanSelection.getItem(0).getV());
        }, this);

        chart.setTimeRange(timeSpanSelection.getItem(0).getV());

        titleContainer.add(timeSpanSelector);

        var dateField = new qx.ui.form.DateField().set({
            value       : null,
            dateFormat  : new qx.util.format.DateFormat("dd.MM.yyyy"),
            placeholder : 'now'
        });

        titleContainer.add(dateField);

        dateField.addListener('changeValue', function(e) {
            var date = e.getData();

            if (date) {
                chart.setEndTime(Math.round(date.getTime() / 1000));
            } else {
                chart.setEndTime(null);
            }
        });

        titleContainer.add(new qx.ui.core.Spacer(10), { flex : 1 });
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
        __viewSelector : null,
        __printBtn : null,
        __chart : null,
        __template : null,


        /**
         * Setup the Chart view.
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _applyArgs : function(newArgs, oldArgs) {
            var viewModel = qx.data.marshal.Json.createModel(newArgs.views);
            this.__template = newArgs.template;
            this.__viewSelector.setModel(viewModel);
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
