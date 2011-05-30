/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

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
       titleContainer.add(new qx.ui.basic.Label(this.tr('View')));
       var viewSelector = this.__viewSelector = new qx.ui.form.VirtualSelectBox().set({
           labelPath: 'title',
           minWidth: 100,
           maxListHeight: null
       });
       titleContainer.add(viewSelector,{flex: 1});

       var viewSelection = viewSelector.getSelection();
       viewSelection.addListener("change",function(e){
           chart.setBaseUrl(viewSelection.getItem(0).getSrc());                
       },this);

       titleContainer.add(new qx.ui.core.Spacer(20),{flex: 2});                      
       
       // time span
       titleContainer.add(new qx.ui.basic.Label(this.tr('Range')));
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
           maxListHeight: null
       });

       var timeSpanSelection = timeSpanSelector.getSelection();
       timeSpanSelection.addListener("change",function(e){
           chart.setTimeRange(timeSpanSelection.getItem(0).getV());
       },this);
       chart.setTimeRange(timeSpanSelection.getItem(0).getV());
       
       titleContainer.add(timeSpanSelector);

       // end date
       titleContainer.add(new qx.ui.basic.Label(this.tr('End')).set({paddingLeft: 10}));
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
            // this.__chart.setBaseUrl(viewModel.getItem(0).getSrc());                                    
        }
    }    
});
