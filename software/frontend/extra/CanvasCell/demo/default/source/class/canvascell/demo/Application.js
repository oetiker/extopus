/* ************************************************************************

   Copyright:
     2010 OETIKER+PARTNER AG, http://www.oetiker.ch
     
   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tobias Oetiker (oetiker)

************************************************************************ */
// Utf8Check: äöü

/**
 * This is the main application class of your custom application "canvascell"
 */
qx.Class.define("canvascell.demo.Application", {
    extend : qx.application.Standalone,
    members : {
        main : function() {
            this.base(arguments);
            if (qx.core.Environment.get("qx.debug")) {
                qx.log.appender.Native;
                qx.log.appender.Console;
            }

            var win = new qx.ui.window.Window("CanvasCellRenderer").set({
                layout : new qx.ui.layout.Grow(),
                allowClose: false,
                allowMinimize: false,
                contentPadding: 0,
                width: 800,
                height: 300
            });
            win.addListener('appear',function(){
                win.center();
            });
            win.open();

            // table model
            var tableModel = new qx.ui.table.model.Simple();
            tableModel.setColumns([ this.tr("ID"), "Bar", "Spark", "TwoBar","QBars","DoubleBar" ]);
            tableModel.setData(this.createRandomRows(100));
            // table
            var custom = {
                tableColumnModel : function(obj) {
                    return new qx.ui.table.columnmodel.Resize(obj);
                }
            };

            var table = new qx.ui.table.Table(tableModel,custom).set({
                decorator: null
            })

            var tColMod = table.getTableColumnModel();
            var resizeBehavior = tColMod.getBehavior();

            // This uses the set() method to set all attriutes at once; uses flex
            resizeBehavior.set(0, { width:"1*" });
            resizeBehavior.set(1, { width:"1*" });
            resizeBehavior.set(2, { width:"2*" });
            resizeBehavior.set(3, { width:"1*" });
            resizeBehavior.set(4, { width:"1*" });
            resizeBehavior.set(5, { width:"1*" });
    
            var barRenderer = new canvascell.Renderer(
                new canvascell.plotter.Bar({
                    fill   : '#280',
                    border : '#260'
                })
            );
            tColMod.setDataCellRenderer(1,barRenderer);

            var sparkRenderer = new canvascell.Renderer(
                new canvascell.plotter.SparkLine({
                    lineWidth   : 0.5,
                    lineColor   : '#228',
                    sparkRadius : 1,
                    sparkColor  : '#f22',
                    singleScale : true,
                    depth       : 30
                })
            );
            tColMod.setDataCellRenderer(2,sparkRenderer);

            var twoBarRenderer = new canvascell.Renderer(
                new canvascell.plotter.TwoBar({
                    mainbarFill    : '#b00',
                    mainbarBorder  : '#a00',
                    stackbarFill   : '#b80',
                    stackbarBorder : '#a70'
                })
            );
            tColMod.setDataCellRenderer(3,twoBarRenderer);

            var qBarsRenderer = new canvascell.Renderer(
                new canvascell.plotter.QBars({
                    badBarColor:  '#f00',
                    badBgColor:   '#f88',
                    goodBarColor: '#0a0',
                    goodBgColor:  '#afa'
                })
            );
            tColMod.setDataCellRenderer(4,qBarsRenderer);

            var doubleBarRenderer = new canvascell.Renderer(
                new canvascell.plotter.DoubleBar({
                    upFill    : '#b00',
                    upBorder  : '#a00',
                    downFill   : '#b80',
                    downBorder : '#a70'
                })
            );
            tColMod.setDataCellRenderer(5,doubleBarRenderer);
            win.add(table);
        },

        createRandomRows: function(rowCount) {
            var rowData = [];
            var now = new Date().getTime();
            var dateRange = 400 * 24 * 60 * 60 * 1000; // 400 days
            var nextId = 0;
            for (var row = 0; row < rowCount; row++) {
                var spark = [];
                for (var i=0;i<30;i++){
                    spark.push(Math.random()*100);
                }
                var qBars = {
                    left: Math.round(Math.random()*8),
                    right: Math.round(Math.random()*8),
                    data: spark
                };
                var two = {
                    mainbar: Math.random()*10,
                    stackbar: Math.random()*3
                };
                var dbl = [
                    Math.random()*10,
                    Math.random()*10
                ];
                rowData.push([row,row,spark,two,qBars,dbl]);
            }
            return rowData;
        }
    }
});
