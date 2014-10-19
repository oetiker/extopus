/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Show a <b>chart</b> image from the monitoring System.
 */
qx.Class.define("ep.visualizer.BrowserChart", {
    extend : ep.visualizer.AbstractVisualizer,

    /**
     * @param instance {String} unique key for visualizer
     * @param title {String} tab title
     * @param args  {Map} configuration arguments.
     * @return {void} 
     *
     * Setup the Chart view. The arguments map must look like this:
     * 
     * <pre code='javascript'>
     * {
     *    recId: recordId,
     *    views: [ { title: 'x', src: 'view' }, { ... } ],
     *    chart: [
     *         { cmd: 'LINE', width: 1, color, '#ff00ff', legend: 'text' },
     *         { cmd: 'AREA', stack: 1, color, '#df33ff', legend: 'more text' },
     *          ...
     *    ]
     * }
     * </pre>
     */

  construct : function(instance,title, args, view) {
        this.base(arguments, instance,title, args, view);
        this._setLayout(new qx.ui.layout.VBox(10));
        var titleContainer = this.__titleContainer = new qx.ui.container.Composite(
            new qx.ui.layout.HBox(8).set({ alignY : 'middle' })
        );
        if (!args.compact){
            this._add(titleContainer);
        }
        // the chart
        var chart = this.__chart = new ep.visualizer.chart.BrowserChart(instance,args.recId,args.chart);
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
            }
        ]);
        titleContainer.add(form);
        titleContainer.add(new qx.ui.core.Spacer(10), { flex : 1 });

        form.addListener('changeData',this._updateChart,this);

        this.setArgs(args);
    },

    statics : { 
        /**
         * The name of the visualizer is <code>chart</code>
         */
        KEY : 'browserchart' 
    },

    members : {
        __titleContainer: null,
        __chart : null,
       
        /**
         * Update Chart Event Handler
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _updateChart: function(e){
            var d = e.getData();
            this._userCfg = d;
            this.__titleContainer.setEnabled(true);
            this.__chart.setView(d.view);
            this.__chart.setSize();
        },
        /**
         * Setup the BrowserChart view.
         *
         * @param newArgs {var} new args
         * @param oldArgs {var} old args
         * @return {void} 
         */
        _applyArgs : function(newArgs, oldArgs) {
            var sb = newArgs.views || [];
            var cfg = this._userCfg;
            this._cfgForm.setSelectBoxData('view',sb);
            this.base(arguments, newArgs, oldArgs);
            this.__chart.clearData();
            this.__chart.set({
                recId: newArgs.recId,
                instance: this.getInstance(),
                chartDef: newArgs.chart
            });
            this._cfgForm.setData(cfg);
        }
    }
});
