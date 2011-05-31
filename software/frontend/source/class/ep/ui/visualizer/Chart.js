/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/* ***************
#asset(qx/icon/${qx.icontheme}/16/actions/document-save.png)
****************/

/**
 * Show page from monitoring System.
**/
qx.Class.define("ep.ui.visualizer.Chart", {
    extend : ep.ui.visualizer.AbstractVisualizer,
    construct : function(title) {
        this.base(arguments,title);
        this.set({
            layout: new qx.ui.layout.VBox(5),
            padding: 5
        });
        var titleContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox(5).set({
            alignY: 'middle'
        }));
        this.add(titleContainer);
        // the chart
        var chart = this.__chart = new ep.ui.visualizer.ChartImage();
        this.add(chart,{flex: 1});            
        // node chooser
//      titleContainer.add(new qx.ui.basic.Label(this.tr('View')));
        var viewSelector = this.__viewSelector = new qx.ui.form.VirtualSelectBox().set({
           labelPath: 'title',
           width: 280,
           maxListHeight: null
        });
        titleContainer.add(viewSelector);
        var savePdf = new qx.ui.form.Button(this.tr('Save PDF'),"icon/16/actions/document-save.png").set({
            enabled: false
        });
        savePdf.addListener('execute',this._downloadPdf,this);

        var viewSelection = viewSelector.getSelection();
        viewSelection.addListener("change",function(e){
            var item = viewSelection.getItem(0);
            if (item == null){    
                chart.setBaseUrl(null);
                savePdf.setEnabled(false);
            }
            else {                
                var url = item.getSrc();
                chart.setBaseUrl(url);
                savePdf.setEnabled(true);
            }
       },this);

       
        // time span
//      titleContainer.add(new qx.ui.basic.Label(this.tr('Range')));
        var timeSpan = [
           { l: this.tr('1 Day'), v: 24*3600 },
           { l: this.tr('2 Days'), v: 2*24*3600 },
           { l: this.tr('1 Week'), v: 7*24*3600 },
           { l: this.tr('1 Month'), v: 31*24*3600 },
           { l: this.tr('3 Months'), v: 3*31*24*3600},
           { l: this.tr('6 Months'), v: 3*31*24*3600},
           { l: this.tr('1 Year'), v: 366*24*3600},
           { l: this.tr('2 Year'), v: 2*366*24*3600}
        ];
        var timeSpanModel = qx.data.marshal.Json.createModel(timeSpan);
        var timeSpanSelector = new qx.ui.form.VirtualSelectBox(timeSpanModel).set({
            labelPath: 'l',
            maxListHeight: null,
            width: 100
        });

        var timeSpanSelection = timeSpanSelector.getSelection();
        timeSpanSelection.addListener("change",function(e){
            chart.setTimeRange(timeSpanSelection.getItem(0).getV());
        },this);
        chart.setTimeRange(timeSpanSelection.getItem(0).getV());
       
        titleContainer.add(timeSpanSelector);

        // end date
//      titleContainer.add(new qx.ui.basic.Label(this.tr('End')).set({paddingLeft: 10}));
        var dateField = new qx.ui.form.DateField().set({
            value: null,
            dateFormat: new qx.util.format.DateFormat("dd.MM.yyyy"),
            placeholder: 'now'
        });
        titleContainer.add(dateField);

        dateField.addListener('changeValue',function(e){
            var date = e.getData();
            if (date){
               chart.setEndTime(Math.round(date.getTime()/1000));
            }
            else {
               chart.setEndTime(null);
            }            
        });
        titleContainer.add(new qx.ui.core.Spacer(20),{flex: 1});                      
        titleContainer.add(savePdf);
    },
    statics: {
        KEY: 'chart'
    },
    members: {
        __viewSelector: null,        
        __chart: null,
        _applyArgs: function(newArgs,oldArgs){
            var viewModel = qx.data.marshal.Json.createModel(newArgs.views);
            this.__viewSelector.setModel(viewModel);
        },
        _downloadPdf: function(){
            var chart = this.__chart;
            var end = chart.getEndTime() || Math.round(new Date().getTime()/1000);
            var start =  end - chart.getTimeRange();            
            var baseUrl = chart.getBaseUrl();
            var url = baseUrl+'&width=1000&height=500&start='+start+'&end='+end+'&format=.pdf';
            var win = qx.bom.Window.open(url, '_blank');
            qx.bom.Event.addNativeListener(win,'load', function(e) {
                var body = qx.dom.Node.getBodyElement(win);
                var doc  = qx.dom.Node.getDocumentElement(win);
                /* if the window is empty, then it got opened externally */
                if ((doc && qx.dom.Hierarchy.isEmpty(doc)) 
                    || (body && qx.dom.Hierarchy.isEmpty(body))) {
                    win.close();
                }
            });
        }
    }    
});
