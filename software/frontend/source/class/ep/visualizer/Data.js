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
qx.Class.define("ep.visualizer.Data", {
    extend : ep.visualizer.AbstractVisualizer,
    construct : function(title,args) {
        this.base(arguments,title);
        this.set({
            layout: new qx.ui.layout.VBox(10)
        });
        var titleContainer = new qx.ui.container.Composite(new qx.ui.layout.HBox(8).set({
            alignY: 'middle'
        }));
        this.add(titleContainer);
        var dataTable = this.__dataTable = new ep.visualizer.DataTable(args.instance,args.columns,args.column_widths,args.column_units);
        this.add(dataTable);
        // view selector
        var intervalSelector = this.__intervalSelector = new qx.ui.form.VirtualSelectBox().set({
           labelPath: 'name',
           width: 100,
           maxListHeight: null
        });
        titleContainer.add(intervalSelector);
        var intervalSelection = intervalSelector.getSelection();
        intervalSelection.addListener("change",function(e){
            var item = intervalSelection.getItem(0);
            if (item == null){    
                titleContainer.setEnabled(false);
                dataTable.setInterval(null);
            }
            else {
                dataTable.setInterval(item.getKey());
            }
       },this);

       
        // time span
        titleContainer.add(new qx.ui.basic.Label(this.tr('rows')).set({paddingLeft: 8}));
        var rowCount = new qx.ui.form.Spinner(1).set({
            maximum: 1000,
            minimum: 1,
            pageStep: 10,
            singleStep: 1
        });

        titleContainer.add(rowCount);
        rowCount.addListener('changeValue',function(e){
            dataTable.setCount(e.getData());   
        },this);
        dataTable.setCount(1);
            
        titleContainer.add(new qx.ui.basic.Label(this.tr('end date')).set({paddingLeft: 5}));

        var dateField = new qx.ui.form.DateField().set({
            value: null,
            dateFormat: new qx.util.format.DateFormat("dd.MM.yyyy"),
            placeholder: 'now'
        });
        this.__endDate = Math.round(new Date().getTime()/1000);

        titleContainer.add(dateField);

        dateField.addListener('changeValue',function(e){
            var date = e.getData();
            dataTable.setEndDate(date);
        },this);

        titleContainer.add(new qx.ui.core.Spacer(20),{flex: 1});                      
        var saveCsv = new qx.ui.form.Button(this.tr('Save CSV'),"icon/16/actions/document-save.png");
        saveCsv.addListener('execute',this._downloadCsv,this);
        titleContainer.add(saveCsv);

        this.setArgs(args);
    },
    statics: {
        KEY: 'data'
    },
    members: {    
        __dataTable:  null,
        __csvUrl: null,
        _applyArgs: function(newArgs,oldArgs){
            var intervalModel = qx.data.marshal.Json.createModel(newArgs.intervals);
            this.__intervalSelector.setModel(intervalModel);
            var dt = this.__dataTable;        
            dt.set({
                treeUrl: newArgs.treeUrl,
                hash: newArgs.hash
            });
            /* trigger reload */
            dt.setNodeId(newArgs.nodeId);
            this.__csvUrl = newArgs.csvUrl;
        },
        _downloadCsv: function(){
            var data = this.__dataTable;
            var end = Math.round(new Date().getTime()/1000);
            if (data.getEndDate()){
                end = Math.round(data.getEndDate().getTime()/1000);
            }
            var url = this.__csvUrl+'&interval='+data.getInterval()+'&end='+end+'&count='+data.getCount();
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
