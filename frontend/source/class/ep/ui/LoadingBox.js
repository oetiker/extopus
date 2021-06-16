/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/*
 * @asset(ep/loader.gif)
 * @asset(qx/icon/Tango/64/status/dialog-information.png)
*/

/**
 * A container with the ability to overlay its prime content with either
 * a loading animation or the message No Data. Configure the widget by setting the {@link #ep.ui.LoadingBox~setViewMode}.
 */
qx.Class.define("ep.ui.LoadingBox", {
    extend : qx.ui.core.Widget,

    /**
     * wrap the loading Box around the given widget
     *
     * @param widget {Widget} widget to wrap
     * @param tardis {Boolean} in tardis mode, the size of the widget is ignored while layouting
     */
    construct : function(widget,tardis) {
        this.base(arguments);

        this.__image = widget;
        this._setLayout(new qx.ui.layout.Grow());
        /* the tardis layout does not care for the size of the image contained within */
        if (tardis){
            var tardis = new qx.ui.core.Widget();
            tardis._setLayout(new ep.ui.layout.Tardis());
            tardis._add(widget);        
            this._add(tardis);
        }
        else {
            this._add(widget);
        }
            


        var loader = this.__loader = new qx.ui.basic.Atom(null, "ep/loader.gif").set({
            visibility      : 'hidden',
            show            : 'icon',
            backgroundColor : '#ffffff',

            //          opacity: 0.7,
            allowGrowX      : true,
            allowGrowY      : true,
            allowShrinkX    : true,
            allowShrinkY    : true,
            alignX          : 'center',
            alignY          : 'middle',
            center          : true
        });

        this._add(loader);

        var noData = this.__noData = new qx.ui.basic.Atom(this.tr("no data available"), "icon/64/status/dialog-information.png").set({
            visibility      : 'hidden',
            gap             : 20,
            backgroundColor : '#ffffff',
            show            : 'both',
            font            : new qx.bom.Font(50, [ 'sans-serif' ]),
            textColor       : '#bfbfbf',
            allowGrowX      : true,
            allowGrowY      : true,
            allowShrinkX    : true,
            allowShrinkY    : true,
            alignX          : 'center',
            alignY          : 'middle',
            center          : true
        });
        this._add(noData);
    },

    events : {
        viewReady: 'qx.event.type.Event'
    },

    properties : {
        /**
         * The LoadingBox supports tree viewModes:
         *
         * <ul>
         * <li><b>loading</b>: shows a loader animation. It only shows if the viewMode has been in loading state for more than 100ms</li>
         * <li><b>nodata</b>: shows the no data message</li>
         * <li><b>ready</b>: shows the widget provided at create time</li>
         * </ul>
         */
        viewMode : {
            init  : 'ready',
            apply : '_applyViewMode'
        }
    },

    members : {
        __loader : null,
        __noData : null,
        __image  : null,
        __runningTimer : null,


        /**
         * Set the View Mode
         *
         * @param newValue {var} new mode
         * @param oldValue {var} old mode
         * @return {void} 
         */
        _applyViewMode : function(newValue, oldValue) {
            if (this.__runningTimer) {
                this.__runningTimer.stop();
                this.__runningTimer = null;
            }
            if (newValue == oldValue) {
                return;
            }
            switch(newValue)
            {
                case 'loading':                    
//                    this.__runningTimer = qx.event.Timer.once(function() {
                        this.__runningTimer = null;
                        this.__loader.show();
                        this.__noData.hide();
/*                    },
                    this, 100);
*/
                    break;

                case 'nodata':
//                    this.__runningTimer = qx.event.Timer.once(function() {
                        this.__runningTimer = null;
                        this.__loader.hide();
                        this.__noData.show();
/*                    },
                    this, 300); */
                    break;

                case 'ready':
                    this.fireEvent("viewReady");
                    this.__loader.hide();
                    this.__noData.hide();
                    break;
            }
        }
    }
});
