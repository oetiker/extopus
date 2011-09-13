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
qx.Class.define("ep.ui.ChartImage", {
    extend : ep.ui.LoadingBox,

    construct : function() {
        var img = this.__img = new qx.ui.basic.Image().set({
            allowGrowX   : true,
            allowGrowY   : true,
            allowShrinkX : true,
            allowShrinkY : true
        });

        this.base(arguments, img);
        img.addListener('appear', this.reloadChart, this);
        img.addListener('resize', this.reloadChart, this);
        var timer = this.__timer = new qx.event.Timer(300 * 1000);

        timer.addListener('interval', function() {
            if (!this.getEndTime()) {
                this.reloadChart();
            }
        },
        this);

        img.addListener('loaded', function() {
            this.debug('image loaded');
            timer.restart();
            this.setViewMode('ready');
        },
        this);

        img.addListener('loadingFailed', function() {
            this.setViewMode('nodata');
        }, this);

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


        /**
         * Reload the chart. The reload will only happen when all the required information for requesting a chart from the 
         * server are provided.
         *
         * @return {void} 
         */
        reloadChart : function(newVal,oldVal,key) {            
            this.debug('reloading '+newVal+' - '+oldVal+' ('+key+')');
            // do not reload if something is being set without changeing it
            if (newVal && oldVal && newVal == oldVal){
                return;
            }
            var url = this.getBaseUrl();
    
            if (url == null) {
                this.setViewMode('nodata');
//              this.__img.setSource(null);
                return;
            }

            var range = this.getTimeRange();
            var end = this.getEndTime() || (Math.round(new Date().getTime() / 1000 / 60) * 60);
            var el = this.getContainerElement().getDomElement();

            if (range && end && el) {
                // sync screen before we measure things
                qx.html.Element.flush();
                var width = qx.bom.element.Dimension.getWidth(el);
                var height = qx.bom.element.Dimension.getHeight(el);

                if (width > 0 && height > 0) {
                    var src = url + '&start=' + (end - range) + '&end=' + end + '&width=' + width + '&height=' + height + '&format=.png';

                    if (!qx.io.ImageLoader.isLoaded(src)) {
                        this.setViewMode('loading');
                        this.__img.setSource(src);
                    }
                    else {
                        this.__img.setSource(src);
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
