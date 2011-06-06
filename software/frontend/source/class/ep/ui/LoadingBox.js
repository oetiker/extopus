/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * Navigation Window with tree and table
 */
qx.Class.define("ep.ui.LoadingBox", {
    extend : qx.ui.core.Widget,

    construct : function(widget) {
        this.base(arguments);
        this.set({
            allowGrowX: true,
            allowGrowY: true,
            allowShrinkX: true,
            allowShrinkY: true
        });
        this._setLayout(new qx.ui.layout.Grow());
        this._add(widget);
        var loader = this.__loader = new qx.ui.basic.Atom(null,"ep/loader.gif").set({
            visibility: 'hidden',
            show: 'icon',
            backgroundColor: '#fcfcfc',
            opacity: 0.7,
            allowGrowX: true,
            allowGrowY: true,
            allowShrinkX: true,
            allowShrinkY: true,
            alignX: 'center',
            alignY: 'middle',
            center: true
        });
        this._add(loader);
    },
    properties: {
        loading: {
            init : false,
            check: 'Boolean',
            apply: '_applyLoading'
        }
    },

    members: {
        __loader: null,
        __runningTimer: null,
        _applyLoading: function(newValue,oldValue){
            if (newValue == oldValue){
                return;
            }
            if (newValue){                                
                this.__runningTimer = qx.event.Timer.once(function(){
                    this.__runningTimer = null;
                    this.__loader.show();
                },this,200);
            }
            else {
                if (this.__runningTimer){
                    this.__runningTimer.stop();
                    this.__runningTimer = null;
                }
                this.__loader.hide();
            }
        }
    }
});
