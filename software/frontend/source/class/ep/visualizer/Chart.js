/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/* ***************
#asset(qx/icon/${qx.icontheme}/16/actions/document-save.png)
#asset(qx/icon/${qx.icontheme}/16/actions/document-print.png)
****************/

/**
 * Show page from monitoring System.
**/
qx.Class.define("ep.visualizer.Chart", {
    extend : ep.visualizer.AbstractVisualizer,
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
        var chart = this.__chart = new ep.visualizer.ChartImage();
        this.add(chart,{flex: 1});            


        // view selector
        var viewSelector = this.__viewSelector = new qx.ui.form.VirtualSelectBox().set({
           labelPath: 'title',
           width: 280,
           maxListHeight: null
        });
        titleContainer.add(viewSelector);
        var viewSelection = viewSelector.getSelection();
        viewSelection.addListener("change",function(e){
            var item = viewSelection.getItem(0);
            if (item == null){    
                chart.setBaseUrl(null);
                titleContainer.setEnabled(false);
                this.__printBtn.setEnabled(false);
            }
            else {                
                var url = item.getSrc();
                chart.setBaseUrl(url);
                titleContainer.setEnabled(true);
                this.__printBtn.setEnabled(this.__template != null );            
            }
       },this);

       
        // time span
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
        var savePdf = new qx.ui.form.Button(this.tr('Save PDF'),"icon/16/actions/document-save.png");
        savePdf.addListener('execute',this._downloadPdf,this);
        titleContainer.add(savePdf);
 
        var printBtn = this.__printBtn = new qx.ui.form.Button(this.tr('Print'),"icon/16/actions/document-print.png");
        printBtn.addListener('execute',this._popupPrintPage,this);
        titleContainer.add(printBtn);

    },
    statics: {
        KEY: 'chart'
    },
    members: {
        __viewSelector: null,        
        __printBtn: null,
        __chart: null,
        __template: null,
        _applyArgs: function(newArgs,oldArgs){
            var viewModel = qx.data.marshal.Json.createModel(newArgs.views);
            this.__template = newArgs.template
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
        },
        _fillTemplate: function(){
            var chart = this.__chart;
            var end = chart.getEndTime() || Math.round(new Date().getTime()/1000);
            var start =  end - chart.getTimeRange();
            var view = this.__viewSelector.getSelection();
            var map = {
                'SRC': function(){
                    return chart.getBaseUrl()+'&width=800&height=600&start='+start+'&end='+end+'&format=.png';
                },
                // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_function_as_a_parameter
                'START\\(([^)]+)\\)': function(str,pattern){
                    var fmt = new qx.util.format.DateFormat(pattern);
                    return fmt.format(new Date(start*1000));
                },
                'END\\(([^)]+)\\)': function(str,pattern){
                    var fmt = new qx.util.format.DateFormat(pattern);
                    return fmt.format(new Date(end*1000));
                },
                'VIEW': function(){
                    return view.getItem(0).getTitle();
                }
            };
            var input = this.__template;
            for (var key in map){
                var rx = new RegExp('@@'+key+'@@','g');
                input = input.replace(rx,map[key]);
            }
            return input;                            
        },
        _popupPrintPage: function(){
            var win = qx.bom.Window.open("about:blank", '_blank', {
                scrollbars: 'yes',
                width: 900,
                height: 600
            });
            win.document.write(this._fillTemplate());
            win.print();
        }
    }    
});
