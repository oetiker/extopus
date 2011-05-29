/* ************************************************************************

   Copyrigtht: OETIKER+PARTNER AG
   License:    GPLv3 or later
   Authors:    Tobias Oetiker
   Utf8Check:  äöü

************************************************************************ */

/**
 * Create a table according to the instructions provided.
 */
qx.Class.define("ep.ui.Chart", {
    extend : qx.ui.basic.Image,

    construct : function() {
        this.base(arguments);
        this.set({
            allowGrowX: true,
            allowGrowY: true,
            allowShrinkX: true,
            allowShrinkY: true
        });
        this.addListener('appear',this.reloadChart,this);
        this.addListener('resize',this.reloadChart,this);
        var timer = this.__timer = new qx.event.Timer(300*1000);
        timer.addListener('interval',function(){
            if (! this.getEndTime()){
                this.reloadChart();
            }
        },this);
        this.addListener('loaded',function(){
            timer.restart();
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
        reloadChart: function (){
            var url = this.getBaseUrl();
            var range = this.getTimeRange();
            var end = this.getEndTime() || Math.round( new Date().getTime() / 1000 );
            var el = this.getContainerElement().getDomElement();
            if (url && range && end && el){
                // sync screen before we measure things
                qx.html.Element.flush();
                this.setSource(
                    url
                    +';start='+(end-range)
                    +';end='+end
                    +';width=' + qx.bom.element.Dimension.getWidth(el)
                    +';height=' + qx.bom.element.Dimension.getHeight(el)
                    +';format=.png'
                );
            }
        }
    },
    destruct: function(){
        this.__timer.stop();
    }    
});
