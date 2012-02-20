/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create an image widget to display the chart within the chart visualizer. The chart
 * is reloaded as the widget size changes.
 */
qx.Class.define("ep.visualizer.chart.Image", {
    extend : ep.ui.LoadingBox,

    construct : function() {
        var img = this.__img = new qx.ui.basic.Image();
        img.set({
            allowGrowX   : true,
            allowGrowY   : true,
            allowShrinkY : true,
            allowShrinkX : true
        });
        this.base(arguments, img,true);
        this.addListener('appear', this.reloadChart, this);
        this.addListener('resize', this.reloadChart, this);
        var timer = this.__timer = new qx.event.Timer(300 * 1000);

        this.addListener('disappear', function() {
            timer.stop()
        }, this);

        timer.addListener('interval', function() {
            if (!this.getEndTime()) {
                this.reloadChart();
            }
        },
        this);
        timer.start();
    },

    properties : {
        /**
         * base url to load the chart from the parameters 'end', 'start', 'width', 'height' will be added
         */
        baseUrl : {
            init     : null,
            apply    : 'reloadChart',
            nullable : true
        },
        /**
         * time range for the chart (in seconds)
         */
        timeRange : {
            init     : null,
            check    : 'Integer',
            apply    : 'reloadChart',
            nullable : true
        },
        /**
         * max interval (in seconds)
         */
        maxInterval : {
            init     : null,
            check    : 'Integer',
            apply    : 'reloadChart',
            nullable : true
        },
        /**
         * at what point in time is the end of the chart
         */
        endTime : {
            init     : null,
            check    : 'Integer',
            apply    : 'reloadChart',
            nullable : true
        }
    },

    members : {
        __timer : null,
        __img : null,
        __extraReload : null,
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
            /* do not reload while loading, but schedule an other reload once this one
               is done */
            if (this.getViewMode() == 'loading'){
                if ( ! this.__extraReload ){
                    this.addListenerOnce('viewReady',function(){
                        this.__extraReload = false;
                        this.reloadChart()
                    },this);
                    this.__extraReload = true;
                }
                return;
            }            

            var url = this.getBaseUrl();
    
            if (url == null) {
                this.setViewMode('nodata');
//              this.__img.setSource(null);
                return;
            }

            var range = this.getTimeRange();
            var maxInterval = this.getMaxInterval();
            var end = this.getEndTime() || (Math.round(new Date().getTime() / 1000 / 60) * 60);
            var el = this.getContainerElement().getDomElement();

            if (range && end && el) {
                // sync screen before we measure things
                qx.html.Element.flush(); 
                var width = qx.bom.element.Dimension.getWidth(el);
                var height = qx.bom.element.Dimension.getHeight(el);
                this.__img.set({
                    width: width,
                    height: height
                });
                if (width > 0 && height > 0) {
                    /* clear out the old image first, so we get no flashing */
                    this.__img.setSource(null);
                    this.__timer.stop();
                    var src = url + '&start=' + (end - range) + '&end=' + end + '&width=' + width + '&height=' + height;
                    if (maxInterval){
                        src += '&maxlinestep=' + String(maxInterval);
                    }
                    src += '&format=.png';        
                    if (this.__img.getSource() == src){
                        return;
                    }
                    if (!qx.io.ImageLoader.isLoaded(src)) {
                        this.setViewMode('loading');
                        qx.io.ImageLoader.load(src,function(src,status){
                            if (status.loaded){
                                this.__img.setSource(src);
                                this.__timer.restart();
                                this.setViewMode('ready');
                            }
                            else {
                                this.setViewMode('nodata');
                            }
                        },this);
                    }
                    else {                         
                        this.__img.setSource(src);
                        this.__timer.restart();
                        this.setViewMode('ready');
                    }
                }
            }
        }
    },

    destruct : function() {
        this.__timer.stop();
    }
});
