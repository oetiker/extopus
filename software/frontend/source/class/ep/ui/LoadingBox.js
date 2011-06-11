/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */
/**********
#asset(ep/loader.gif)
#asset(qx/icon/${qx.icontheme}/64/status/dialog-information.png)
**********/
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
            backgroundColor: '#ffffff',
//          opacity: 0.7,
            allowGrowX: true,
            allowGrowY: true,
            allowShrinkX: true,
            allowShrinkY: true,
            alignX: 'center',
            alignY: 'middle',
            center: true
        });
        this._add(loader);
        var noData = this.__noData = new qx.ui.basic.Atom(this.tr("no data available"),"icon/64/status/dialog-information.png").set({
            visibility: 'hidden',
            gap: 20,
            backgroundColor: '#ffffff',
            show: 'both',
            font: new qx.bom.Font(50,['sans-serif']),
            textColor: '#bfbfbf',
            allowGrowX: true,
            allowGrowY: true,
            allowShrinkX: true,
            allowShrinkY: true,
            alignX: 'center',
            alignY: 'middle',
            center: true
        });
        this._add(noData);
    },
    properties: {
        viewMode: {
            init : 'ready',
            apply: '_applyViewMode'
        }
    },

    members: {
        __loader: null,
        __noData: null,
        __runningTimer: null,              
        _applyViewMode: function(newValue,oldValue){
            if (newValue == oldValue){
                return;
            }
            switch (newValue){
                case 'loading':
                    this.__runningTimer = qx.event.Timer.once(function(){
                        this.__runningTimer = null;
                        this.__loader.show();
                        this.__noData.hide();
                    },this,100);
                    break;
                case 'nodata':
                    if (this.__runningTimer){
                        this.__runningTimer.stop();
                        this.__runningTimer = null;
                    }
                    this.__loader.hide();
                    this.__noData.show();
                    break;
                case 'ready':
                    if (this.__runningTimer){
                        this.__runningTimer.stop();
                        this.__runningTimer = null;
                    }
                    this.__loader.hide();
                    this.__noData.hide();
                    break;
            }
        }
    }
});
