/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create a table according to the instructions provided.
 */
qx.Class.define("ep.visualizer.ChartImage", {
    extend : ep.ui.LoadingBox,

    construct : function() {
        var img = this.__img = new qx.ui.basic.Image().set({
            allowGrowX: true,
            allowGrowY: true,
            allowShrinkX: true,
            allowShrinkY: true
        });
        this.base(arguments,img);
        img.addListener('appear',this.reloadChart,this);
        img.addListener('resize',this.reloadChart,this);
        var timer = this.__timer = new qx.event.Timer(300*1000);
        timer.addListener('interval',function(){
            if (! this.getEndTime()){
                this.reloadChart();
            }
        },this);
        img.addListener('loaded',function(){
            timer.restart();
            this.setViewMode('ready');
        },this);
        img.addListener('loadingFailed',function(){
            this.setViewMode('nodata');
        },this);
        timer.start();
    },
    properties: {
        baseUrl: {
            init: null,
            apply: 'reloadChart',
            nullable: true
        },
        timeRange: {
            init: null,
            check: 'Integer',
            apply: 'reloadChart',
            nullable: true
        },
        endTime: {
            init: null,
            check: 'Integer',
            apply: 'reloadChart',
            nullable: true
        }
    },
    members: {
        __timer: null,
        __img: null,
        reloadChart: function (){
            var url = this.getBaseUrl();
            if (url == null){
                this.__img.setSource(null);
                return;
            };
            var range = this.getTimeRange();
            var end = this.getEndTime() || Math.round( new Date().getTime() / 1000 );
            var el = this.getContainerElement().getDomElement();
            var that = this;
            if (range && end && el){
                // sync screen before we measure things
                qx.html.Element.flush();
                var width = qx.bom.element.Dimension.getWidth(el);
                var height = qx.bom.element.Dimension.getHeight(el)
                if (width > 0 && height > 0){
                    that.setViewMode('loading');
                    that.__img.setSource(
                        url
                        +'&start='+(end-range)
                        +'&end='+end
                        +'&width=' + width
                        +'&height=' + height
                        +'&format=.png'
                    );
                }
            }
        }
    },
    destruct: function(){
        this.__timer.stop();
    }    
});
