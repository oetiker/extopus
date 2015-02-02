/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create a D3.js based, interactive chart.
 *
 */

var ID;

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
        this._setLayout(new qx.ui.layout.VBox(10));
        this.set({
            instance: instance,
            recId: recId
        });
        // the chart
        var d3Obj = this.__d3Obj = new qxd3.Svg();
        var margin = this.self(arguments).MARGIN;
        this.__chart = d3Obj.getD3SvgNode()
        .append("g")
            .attr("transform", "translate("+margin.left+","+margin.top+")");

        this.__d3 = d3Obj.getD3();

        // add the svg object into the LoadingBox
        this._add(d3Obj,{flex: 1});

        if (chartDef){
            this.setChartDef(chartDef);
        }

        // insert our global CSS once only
        var CSS = this.self(arguments).BASECSS;
        var selector;
        for (selector in CSS){
            d3Obj.addCssRule(selector, CSS[selector]);
        }

        this.__dataNode = [];


        d3Obj.addListener('appear',this.setSize,this);

        d3Obj.addListener('resize',this.setSize,this);

        var timer = this.__timer = new qx.event.Timer(5 * 1000);

        d3Obj.addListener('disappear', function() {
            timer.stop()
        }, this);

        d3Obj.addListener('appear', function() {
            timer.start()
        }, this);

        timer.addListener('interval', function() {
            this.trackingRedraw();
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
         * track current time
         */
        trackCurrentTime: {
            init     : null,
            check    : 'Boolean',
            nullable : true
        },
        /**
         * instance name of the table. This lets us identify ourselves when requesting data from the server
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
        __fetchAgain: null,
        __legendContainer: null,
        __d3Obj: null,
        __data: null,
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
            this.__yAxisPainter = d3.svg.axis()
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
                case 'LINE':
                    return this.getLinePainter();
                    break;
                case 'AREA':
                    return this.getAreaPainter();
                    break;
                default:
                    this.debug("invalid cmd");
                    break;
            }
        },

        getLinePainter: function(){
            if (this.__linePainter) return this.__linePainter;
            var xScale = this.getXScale();
            var yScale = this.getYScale();
            this.__linePainter = this.__d3.svg.line()
                .interpolate("step-before")
                .x(function(d){ return xScale(d.date); })
                .y(function(d){ return yScale(d.y); })
                .defined(function(d){ return d.d });
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
                .y1(function(d){ return yScale(d.y); })
                .defined(function(d){ return d.d });
            return this.__areaPainter;
        },

        getZoomRectNode: function(){
            if (this.__zoomRectNode) return this.__zoomRectNode;
            var that = this;
            var zoomer = this.__zoomer = this.__d3.behavior.zoom()
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
                    .attr("fill", "none")
                    .attr("shape-rendering", 'crispEdges');
                    break;
                case 'AREA':
                    this.__dataNode[id] = dataArea.append("path")
                    .attr("clip-path", "url(#"+this.__clipPathID+")")
                    .attr("fill",chartDef.color);
                    break;
                default:
                    this.debug("unsupported cmd:" + chartDef.cmd);
                    break;
            }
            return this.__dataNode[id];
        },

        resetChart: function(newValue, oldValue, propertyName){
            if (this.__dataNode){
                for (var i=0;i<this.__dataNode.length;i++){
                    this.__dataNode[i].remove();
                }
            }
            this.__dataNode = [];
            this.__data = null;
            this.setupLegend();
        },
        setupLegend: function(){
            var lc;
            if (! this.__legendContainer ) {
                var margin = this.self(arguments).MARGIN;
                lc = this.__legendContainer = new qx.ui.core.Widget().set({
                    paddingLeft: margin.left
                });
                lc._setLayout(new qx.ui.layout.Flow(15,5));
                this._add(lc);
            }
            else {
                lc = this.__legendContainer;
                lc._removeAll();
            }
            this.getChartDef().forEach(function(item){
                var label = new qx.ui.core.Widget();
                label._setLayout(new qx.ui.layout.HBox(5).set({alignY: 'middle'}));
                var cu = qx.util.ColorUtil;
                var borderColorHsb = cu.rgbToHsb(cu.hex6StringToRgb(item.color));
                borderColorHsb[2] *= 0.9;
                var borderColor = cu.rgbToHexString(cu.hsbToRgb(borderColorHsb));
                var box = new qx.ui.core.Widget().set({
                    width: 12,
                    height: 12,
                    allowGrowX: false,
                    allowGrowY: false,
                    marginBottom: 6,
                    decorator: new qx.ui.decoration.Decorator().set({
                        color: [borderColor],
                        width: [1],
                        style: ['solid'],
                        backgroundColor: item.color
                    })
                });
                label._add(box);
                var legend = new qx.ui.basic.Label().set({
                    value: item.legend
                });
                label._add(legend);
                lc._add(label);
            });
        },
        setSize: function(){
            var el = this.__d3Obj.getContentElement().getDomElement();
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

            this.getYAxisPainter()
                .tickSize(width)
                .ticks(Math.round(height/50));

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

            this.__zoomer.size([width,height]);
            this.redraw();
        },

        trackingRedraw: function(){
            if (this.getTrackCurrentTime()){
                var dates = this.getXScale().domain();
                var interval = dates[1].getTime() - dates[0].getTime();
                dates[1] = new Date();
                dates[0] = new Date(dates[1].getTime() - interval);
                this.getXScale().domain(dates);
                this.redraw();
            }
        },

        yScaleRedraw: function(){
            var dates = this.getXScale().domain();
            if (this.__data){
                var maxValue = 0;
                for(var i=0;i<this.getChartDef().length;i++){
                    if (!this.__data.data[i]) continue;
                    this.__data.data[i].forEach(function(item){
                        if (item.y > maxValue && item.date >= dates[0] && item.date <= dates[1]){
                            maxValue = item.y;
                        }
                    })
                }
                this.getYScale().domain([0,maxValue]).nice();

                this.getYAxisNode().call(this.getYAxisPainter());

                for(var i=0;i<this.getChartDef().length;i++){
                    var node = this.getDataNode(i);
                    if (node.data().length > 0){
                        node.attr("d",this.getDataPainter(i));
                    }
                }
            }
        },

        redraw: function(){
            var dates = this.getXScale().domain();
            var start = Math.round(dates[0].getTime()/1000);
            var end = Math.round(dates[1].getTime()/1000);
            var dataStep = Math.round((end-start)/ this.__chartWidth);
            var extra = Math.round(end - start );
            var d3 = this.__d3;

            start -= extra;
            end += extra;


            this.yScaleRedraw();

            this.getXAxisNode().call(this.getXAxisPainter());


            if (this.__fetchWait){
                this.__fetchAgain = 1;
                return;
            }

            var existingData = this.dataSlicer(start,end,dataStep);
            if (existingData.missingStart == existingData.missingEnd){
                return;
            }

            var needChartDef = this.getChartDef().length == 0;

            var rpc = ep.data.Server.getInstance();
            var that = this;
            this.__fetchWait = 1;
            rpc.callAsyncSmart(function(ret){

                var d3Data = that.__data = that.d3DataTransformer(ret,dataStep);

                var maxValue = 0;

                for(var i=0;i<ret.length;i++){
                    var dataNode = that.getDataNode(i);
                    if (existingData.prepend){
                        d3Data.data[i] = existingData.prepend[i].concat(d3Data.data[i],existingData.append[i]);
                    }
                    dataNode.data([d3Data.data[i]]);
                }

                that.yScaleRedraw();
                that.__fetchWait = 0;
                // if we skipped one, lets redraw again just to be sure we got it all
                if (this.__fetchAgain == 1){
                    qx.event.Timer.once(that.redraw,that,0);
                    this.__fetchAgain = 0;
                }
            },
            'visualize', this.getInstance(), {
                recId    : this.getRecId(),
                step     : dataStep,
                start    : existingData.missingStart,
                end      : existingData.missingEnd,
                view     : this.getView()
            });
        },

        /* figure out what data range we are missing and keep the bits we already have */

        dataSlicer: function(start,end,dataStep){
            var oldData = this.__data;
            var missingStart = start;
            var missingEnd = end;
            var prepend = [];
            var append = [];
            var keepData = oldData != null && typeof(oldData) == 'object' && Math.round(oldData.dataStep) == Math.round(dataStep);
            if (!keepData) {
                return { missingStart: missingStart, missingEnd: missingEnd};
            }
            var oldStart = oldData.data[0][0].date.getTime()/1000;
            var oldEnd = oldData.data[0][oldData.data[0].length-1].date.getTime()/1000;
            // prepend the existing data to the new data
            var prependMode = oldStart <= start && oldEnd >= start;
            var appendMode = oldEnd >= end && oldStart <= end;
            for (var i=0;i<oldData.data.length;i++){
                append[i] = [];
                prepend[i] = [];
                var len = oldData.data[i].length;
                for (var ii=0;ii<len;ii++){
                    var item = oldData.data[i][ii];
                    var date = item.date.getTime()/1000;
                    if ( prependMode && date >= start ) {
                        prepend[i].push(item);
                        missingStart = date+dataStep;
                    }
                    if (appendMode && date <= end ){
                        append[i].push(item);
                        if ( date < missingEnd ) {
                            missingEnd = date-dataStep;
                        }
                    }
                }
            }
            /* lets make sure don't trip over ourselves */
            if (missingStart > missingEnd){
                this.debug("missingStart:"+missingStart+" missingEnd:"+missingEnd);
                missingEnd = missingStart;
            }

            return {
                missingStart: missingStart,
                missingEnd: missingEnd,
                append: append,
                prepend: prepend
            }
        },

        d3DataTransformer: function(data,dataStep){
            var d3 = this.__d3;
            if (data == null || typeof(data) != 'object' || data[0] == null){
                return null;
            }
            var minStep = 24*3600;
            var minStart = (new Date).getTime()/1000;
            data.forEach(function(d){
                if (d.status != 'ok') return;
                if (minStep == null || minStep > d.step){
                    minStep = d.step;
                    minStart = d.start;
                }
            });

            var d3Data = [];
            for (var i=0; i<data.length;i++){
                d3Data[i] = [];
                var chartDef = this.getChartDef()[i];
                if (data[i].status != 'ok') {
                    data[i].values = [NaN];
                    data[i].step = 3600*24;
                }
                var stack = chartDef.stack;
                var len = data[i].values.length;
                var st = minStep/data[i].step;
                for (var ii=0;ii*st < len ; ii++){
                    var y0 = 0;
                    if (stack && i > 0 && d3Data[i-1][ii] != null && typeof(d3Data[i-1][ii]) == 'object'){
                        y0 = d3Data[i-1][ii].y;
                    }
                    var yval = parseFloat(data[i].values[Math.round(ii*st)]);
                    d3Data[i][ii] = {
                        y: (isNaN(yval) ? 0 : yval) +y0,
                        y0: y0,
                        d: !isNaN(yval),
                        date: new Date((minStart+ii*minStep)*1000)
                    }
                }
            }
            return {data:d3Data,dataStep: dataStep}
        }
    },

    destruct : function() {
        this.__timer.stop();
    }
});
