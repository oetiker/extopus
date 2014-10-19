/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create an image widget to display the chart within the chart visualizer. The chart
 * is reloaded as the widget size changes.
 *
 */

var ID;

qx.bom.Event.$$stopPropagation_old = qx.bom.Event.stopPropagation;
qx.bom.Event.stopPropagation = function(e) {
    if (typeof e.target.className !== "object"){
        qx.bom.Event.$$stopPropagation_old(e);
    }
};

qx.Class.define("ep.visualizer.chart.BrowserChart", {
    extend : qx.ui.core.Widget,

    /**
     * @param instance {String} identifying the visualizer instance
     * @param recId {Number} stable identifier for the extopus node
     * @param chartDef {Array} chart description array
     *
     * <pre code='javascript'>
     * { [
     *       { cmd: 'LINE', width: 1, color, '#ff00ff', legend: 'text' },
     *       { cmd: 'AREA', stack: 1, color, '#df33ff', legend: 'more text' },
     *        ... 
     *    ]
     * }
     * </pre>
     */ 
    construct : function(instance,recId,chartDef) {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.Grow());
        this.set({
            instance: instance,
            recId: recId,
            chartDef: chartDef
        });
        // the chart
        var d3Obj = new qxd3.Svg();
        var margin = this.self(arguments).MARGIN;
        this.__chart = d3Obj.getD3SvgNode()
        .append("g")
            .attr("transform", "translate("+margin.left+","+margin.top+")");
        
        this.__d3 = d3Obj.getD3(); 
                
        // add the svg object into the LoadingBox
        this._add(d3Obj);
        
        // insert our global CSS once only
        var CSS = this.self(arguments).BASECSS;
        var selector;
        for (selector in CSS){
            d3Obj.addCssRule(selector, CSS[selector]);
        }

        this.__dataNode = [];

        
        this.addListener('appear',this.setSize,this);

        this.addListener('resize',this.setSize,this);

        var timer = this.__timer = new qx.event.Timer(60 * 1000);

        this.addListener('disappear', function() {
            timer.stop()
        }, this);

        this.addListener('appear', function() {
            timer.start()
        }, this);

        timer.addListener('interval', function() {
            if (!this.getEndTime()) {
                this.reloadChart();
            }
        }, this);

        timer.start();
    },

    statics : { 
        /**
         * Some basic css for the D3 chart <code>browserchart</code>
         */
        BASECSS: {
            'svg': {
                "font": "10px sans-serif"
            },
            '.axis': {
                "shape-rendering": 'crispEdges'
            },
            '.axis path, .axis line': {
                'fill': 'none',
                'stroke-width': '1px'
            },
            '.x.axis path': {
                'stroke': '#000'
            },
            '.x.axis line': {
                'stroke': '#000',
                'stroke-opacity': '.2',
                'stroke-dasharray': '1,1'
            },
            '.y.axis line': {
                'stroke': '#000',
                'stroke-opacity': '.2',
                'stroke-dasharray': '1,1'
            }
        },
        MARGIN: {
            left: 50,
            top: 10,
            bottom: 15,
            right: 10
        }
    },

    properties : {
        /**
         * inbytes, outbytes ...
         */
        view : {
            init     : null,
            nullable : true
        },
        /**
         * amount of time in the chart (in seconds)
         */
        timeWidth : {
            init     : null,
            check    : 'Integer',
            nullable : true
        },
        /**
         * at what point in time is the end of the chart, if no time is give the chart will update automatically
         */
        endTime : {
            init     : null,
            check    : 'Integer',
            nullable : true
        },
        /**
         * instance name of the table. This lets us identify ourselfs when requesting data from the server
         */
        instance : {
            init     : null,
            nullable : true
        },
        /**
         * extopus Id aka recId ... to identify the chart we are talking about
         */
        recId: {
            init     : null,
            check    : 'Integer',
            nullable : true 
         },
         /**
          * chart defs (chart definitions)
          */
        chartDef: {
            init     : [],
            check    : 'Array',
            nullable : true 
        }

    },

    members : {
        __timer : null,
        __d3: null,
        __chart: null,
        __xAxisPainter: null,
        __yAxisPainter: null,
        __linePainter: null,
        __areaPainter: null,
        __xScale: null,
        __yScale: null,
        __zoomRectNode: null,
        __xAxisNode: null,
        __yAxisNode: null,
        __dataNode: null,
        __clipPath: null,
        __chartWidth: null,
        __fetchWait: null,
         /**
         * Reload the chart. The reload will only happen when all the required information for requesting a chart from the 
         * server are provided.
         *
         * @return {void} 
         */
        reloadChart : function(newVal,oldVal,key) {            
            // do not reload if something is being set without changeing it
            if (key && newVal && oldVal && newVal == oldVal){
                return;
            }
            this.setSize(); 
        },
        getDataArea: function(){
            if (this.__dataArea) return this.__dataArea;
            return this.__dataArea =
                this.__chart.insert("g",':first-child');
        },
        getXAxisPainter: function(){
            if (this.__xAxisPainter) return this.__xAxisPainter;
            var customTimeFormat = this.__d3.time.format.multi([
                [".%L", function(d) { return d.getMilliseconds(); }],
                [":%S", function(d) { return d.getSeconds(); }],
                ["%H:%M", function(d) { return d.getMinutes(); }],
                ["%H:%M", function(d) { return d.getHours(); }],
                ["%m-%d", function(d) { return d.getDay() && d.getDate() != 1; }],
                ["%Y-%m-%d", function(d) { return true }]
            ]);
            this.__xAxisPainter = this.__d3.svg.axis()
                .scale(this.getXScale())
                .orient("bottom")
                .tickPadding(6)
                .tickFormat(customTimeFormat);
                
            return this.__xAxisPainter;
        },

        getYAxisPainter: function(){
            if (this.__yAxisPainter) return this.__yAxisPainter;
            var si = ['p','n','y','m','','k','M','G','T','P'];
            var d3 = this.__d3;
            var commasFormatter = d3.format(",.1f");
            this.__yAxisPainter = this.__d3.svg.axis()
                .scale(this.getYScale())
                .orient("left")
                .tickPadding(6)
                .tickFormat(function(d){
                    if (d == 0){
                        return d;
                    }
                    var log = Math.log(d)/Math.LN10;
                    var idx = log < 0 ? Math.ceil(log/3) : Math.floor(log/3);
                    var factor = Math.pow(10,idx*3);
                    return commasFormatter(d/factor) + si[idx+4];
                });

            return this.__yAxisPainter;
        },
        
        getXScale: function(){
            if (this.__xScale) return this.__xScale;
            this.__xScale = this.__d3.time.scale();
            this.__xScale.domain([new Date(new Date().getTime() - 24*3600*1000),new Date()]);
            return this.__xScale;
        },
        
        getYScale: function(){
            if (this.__yScale) return this.__yScale;
            this.__yScale = this.__d3.scale.linear();
            return this.__yScale;
        },
        getDataPainter: function(id){
            switch(this.getChartDef()[id].cmd){
                case 'LINE': return this.getLinePainter();
                case 'AREA': return this.getAreaPainter();
                default: this.debug("invalid cmd");
            }
        },
        getLinePainter: function(){
            if (this.__linePainter) return this.__linePainter;            
            var xScale = this.getXScale();
            var yScale = this.getYScale();
            this.__linePainter = this.__d3.svg.line()
                .interpolate("step-before")
                .x(function(d){ return xScale(d.date); })
                .y(function(d){ return yScale(d.y); });
            return this.__linePainter;
        },
        
        getAreaPainter: function(){
            if (this.__areaPainter) return this.__areaPainter;
            var xScale = this.getXScale();
            var yScale = this.getYScale();
            this.__areaPainter = this.__d3.svg.area()
                .interpolate("step-before")
                .x(function(d){ return xScale(d.date); })
                .y0(function(d){ return yScale(d.y0);})
                .y1(function(d){ return yScale(d.y); });
            return this.__areaPainter;
        },

        getZoomRectNode: function(){
            if (this.__zoomRectNode) return this.__zoomRectNode;
            var that = this;
            var zoomer = this.__d3.behavior.zoom()
                .scaleExtent([0.0001, 1000])
                .on("zoom", function (){that.redraw()});

            zoomer.x(this.getXScale());

            this.__zoomRectNode = this.__chart.append("rect")
                .style({
                    cursor: 'move',
                    fill: 'none',
                    'pointer-events': 'all'
                })
                .call(zoomer);

            return this.__zoomRectNode;
        },

        getXAxisNode: function(){
            if (this.__xAxisNode) return this.__xAxisNode;
            this.__xAxisNode = this.__chart.append("g")
                .attr("class", "x axis");
            return this.__xAxisNode;
        },

        getYAxisNode: function(){
            if (this.__yAxisNode) return this.__yAxisNode;
            this.__yAxisNode = this.__chart.append("g")
                .attr("class", "y axis");
            return this.__yAxisNode;
        },

        getClipPath: function(){
            if (this.__clipPath) return this.__clipPath;
            ID++;
            this.__clipPathID = this.getInstance() + '-clipPath-' + ID;
            this.__clipPath = this.__chart.append("clipPath")
                .attr('id',this.__clipPathID)
                .append("rect");
            return this.__clipPath;
        },

        getDataNode: function(id){
            if (this.__dataNode[id]) return this.__dataNode[id];
            var chartDef = this.getChartDef()[id];
            var dataArea = this.getDataArea();
            switch(chartDef.cmd){
                case 'LINE':
                    this.__dataNode[id] = dataArea.append("path")
                    .attr("clip-path", "url(#"+this.__clipPathID+")")
                    .attr('stroke', chartDef.color)
                    .attr('stroke-width', 2)
                    .attr("fill", "none");
                case 'AREA':
                    this.__dataNode[id] = dataArea.append("path")
                    .attr("clip-path", "url(#"+this.__clipPathID+")")
                    .attr("fill",chartDef.color);
            }
            return this.__dataNode[id];
        },

        clearData: function(){
            for (var i=0;i<this.__dataNode.length;i++){
                this.__dataNode[i].remove();
            }
            this.__dataNode = [];
        },

        setSize: function(){
            var el = this.getContentElement().getDomElement();
            if (!el) return;
            // sync screen before we measure things
            qx.html.Element.flush();
            var margin = this.self(arguments).MARGIN;
            var width = qx.bom.element.Dimension.getWidth(el) - margin.left - margin.right;
            var height = qx.bom.element.Dimension.getHeight(el) - margin.top - margin.bottom;
            this.__chartWidth = width;

            var xScale = this.getXScale();
            var yScale = this.getYScale();

            xScale.range([0,width]);
            yScale.range([height,0]);


            this.getClipPath()
                .attr("width",width)
                .attr("height",height);

            this.getYAxisPainter().tickSize(width);
            this.getXAxisPainter().tickSize(-height,0);

            for (var i=0;i<this.getChartDef().length;i++){
                this.getDataNode(i);
            }
            this.getYAxisNode()
                .attr("transform", "translate(" + width + ",0)");
            this.getXAxisNode()
                .attr("transform", "translate(0," + height + ")");

           


            this.getZoomRectNode()
                .attr('width',width)
                .attr('height',height);

            this.redraw();
        },


        redraw: function(){
            var dates = this.getXScale().domain();
            var start = Math.round(dates[0].getTime()/1000);
            var end = Math.round(dates[1].getTime()/1000);
            var extra = Math.round((end - start ) / 10);
            var d3 = this.__d3;

            start -= extra;
            end += extra;


            this.getXAxisNode().call(this.getXAxisPainter());
            for(var i=0;i<this.getChartDef().length;i++){
                var node = this.getDataNode(i);
                if (node.data()[0]){
                    node.attr("d",this.getDataPainter(i)); 
                }
            }

            var rpc = ep.data.Server.getInstance();
            var that = this;
            if (this.__fetchWait){
                return;
            }
            this.__fetchWait = 1;
            rpc.callAsyncSmart(function(data){
                var d3Data = that.d3DataTransformer(data);
                that.getYScale().domain([0,d3Data.max]).nice();
                that.getYAxisNode().call(that.getYAxisPainter());
                for(var i=0;i<data.length;i++){
                    var dataNode = that.getDataNode(i);
                    dataNode.data([d3Data.data[i]]);
                    that.getDataNode(i).attr("d",that.getDataPainter(i)); 
                }
                that.__fetchWait = 0;
            },
            'visualize', this.getInstance(), {
                recId    : this.getRecId(),
                width    : this.__chartWidth,
                start    : start,
                end      : end,
                view     : this.getView()
            });
        },

        d3DataTransformer: function(data){
            var d3 = this.__d3;
            var minStep = data[0].step;
            var minStart = data[0].start;
            var maxVal = 0;
            data.forEach(function(d){
                if (minStep > d.step){
                    minStep = d.step;
                    minStart = d.start;
                }
            });
            var d3Data = [];
            for (var i=0; i<data.length;i++){
                d3Data[i] = [];
                var stack = this.getChartDef()[i].stack;
                for (var ii=0;ii*minStep/data[i].step < data[i].data.length; ii++){
                    var y0 = 0;
                    if (stack && i > 0 ){
                        y0 = d3Data[i-1][ii].y;
                    }
                    var y = y0 + data[i].data[Math.round(ii*minStep/data[i].step)];
                    d3Data[i][ii] = {
                        y: y,
                        y0: y0,
                        date: new Date((minStart+ii*minStep)*1000) 
                    }
                    if (y > maxVal){
                        maxVal = y;
                    }
                }
            }
            return {data:d3Data,max:maxVal}; 
        }       
    },

    destruct : function() {
        this.__timer.stop();
    }
});
