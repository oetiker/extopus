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
        var sm = table.getSelectionModel();
        sm.setSelectionMode(qx.ui.table.selection.Model.SINGLE_SELECTION);
        var tm = table.getTableModel();
        var rpc=ep.data.Server.getInstance();
        sm.addListener('changeSelection',function(e){
            var kids = this.getChildren();
            // kids is not a copy but the actual kids array ... it shrinks as the
            // kids are removed.
            while (kids.length > 0){
                this.remove(kids[0])
            };
            sm.iterateSelection(function(ind){
                // this will only iterate once since we are in single selection 
                // mode ... the first column holds the nodeId               
                rpc.callAsyncSmart(qx.lang.Function.bind(this._showVisualizers,this),'getVisualizers',tm.getValue(0,ind));
            },this);
        },this);
    },
    members: {
        _showVisualizers: function(vizList){
            for (var i = 0; i< vizList.length;i++) {
                var viz = vizList[i];
                var args = viz.arguments;
                if (! args ){
                    this.debug('skipping empty viz');
                    continue;
                };
                
                var tab = new qx.ui.tabview.Page(this['tr'](viz.title));
                this.add(tab);

                switch(viz.visualizer){
                    case 'chart':
                        this._loadChart(args,tab);
                        break;
                    case 'iframe':
                        tab.setLayout(new qx.ui.layout.Grow());
                        tab.add( new qx.ui.embed.ThemedIframe().set({
                            source: args.src
                        }));
                        break;
                    case 'plain':
                        tab.set({
                            layout: new qx.ui.layout.Grid(3,3),
                            padding: 5
                        });                            
                        var row = 0;
                        for (var key in  viz.arguments){
                            var l = new qx.ui.basic.Label(key + ': ');
                            var v = new qx.ui.basic.Label(viz.arguments[key]);
                            tab.add(l,{row:row,column:0});
                            tab.add(v,{row:row,column:1});
                            row++;
                        }
                        break;
                    default: 
                        qx.dev.Debug.debugObject(vizList[i],'Problem with');                                            
                }              
            }
                
        },
        _loadChart: function(args,container){
            container.set({
                 layout: new qx.ui.layout.VBox(5),
                 padding: 5
            });
            var titleContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox(5).set({
                alignY: 'middle'
            }));
            container.add(titleContainer);
            // the chart
            var chart = new ep.ui.Chart();
            container.add(chart,{flex: 1});            
            // node chooser
            titleContainer.add(new qx.ui.basic.Label(this.tr('Chart')));
            var nodeModel = qx.data.marshal.Json.createModel(args.views);            
            var nodeSelector = new qx.ui.form.VirtualSelectBox(nodeModel).set({
                labelPath: 'title',
                minWidth: 100,
                maxListHeight: null
            });
            titleContainer.add(nodeSelector,{flex: 1});

            var nodeSel = nodeSelector.getSelection();
            nodeSel.addListener("change",function(e){
                chart.setBaseUrl(nodeSel.getItem(0).getSrc());                
            },this);
            chart.setBaseUrl(nodeSel.getItem(0).getSrc());

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

            var timeSpanSel = timeSpanSelector.getSelection();
            timeSpanSel.addListener("change",function(e){
                chart.setTimeRange(timeSpanSel.getItem(0).getV());
            },this);
            chart.setTimeRange(timeSpanSel.getItem(0).getV());
            
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
            });


            
        }
    }    
});
