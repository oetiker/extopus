/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/*
#asset(qx/icon/${qx.icontheme}/16/actions/list-add.png)
#asset(ep/loading16.gif)
*/

/**
 * Master Dashboard Menu, showing all Dashboards available on the server. 
 * This is a bit of a special menu as it contains a custom button already
 * which integrates nicely into a tabview bar ... you cat get to the button
 * using the getOpener method.
 */

qx.Class.define("ep.ui.DashServerMenu", {
    extend: qx.ui.menu.Menu,

    construct : function() {
        this.base(arguments);
        var plus = new qx.ui.form.MenuButton(null,"icon/16/actions/list-add.png",this).set({
            margin: [4,4,4,4],
            appearance: "menubar-button",
            center: true,
            show: 'icon' 
        });
        this._menuCache = {};
        this._menuBusy = new qx.ui.menu.Button("Loading Dashlist","ep/loading16.gif").set({
            enabled: false
        });
        
        this.addListener('changeVisibility',function(e){
            var vis = e.getData();
            if (vis == 'visible'){
                this._updateMenu();
            }
        },this);
    },
    members: {
        _lastUpdate: null,
        _menuCache: null,
        _updateing: false,
        _updateMenu: function(){
            var rpc = ep.data.Server.getInstance();        
            var menu = this;
            var cache = this._menuCache;
            if (this._updateing){
                return;
            }
            this._updateing = true;
            menu.removeAll();
            menu.add(this._menuBusy);
            rpc.callAsyncSmart(function(ret){
                menu.removeAll();
                ret.forEach(function(item){
                    if (item.up){
                        var button = cache[item.id];
                        if (!button){
                            button = new qx.ui.menu.Button(item.lb);
                            button.addListener('execute',menu._onOpen,this);
                            cache[item.id] = button;
                        } else {
                            button.setLabel(item.lb);
                        }
                        if (item.up > menu._lastUpdate){
                            menu._lastUpdate = item.up
                        }
                        button.setUserData('item',item);
                    }
                    menu.add(cache[item.id]);
                });
                menu._updateing = false;
            },'getDashList',this._lastUpdate);
        },
        _onOpen: function(e){
            var button = e.getTarget();
            var item = button.getUserData('item');
            var board = ep.ui.DashManager.getInstance().newBoard(item.lb);
            var cache = this._menuCache;
            board.set({
                dashId: item.id,
                updateTime: item.up
            });
            button.setEnabled(false);
            board.addListener('close',function(){
               button.setEnabled(true);
            });
            item.cfg.forEach(function(viz){
                board.addVisualizer(viz.cfg,viz.position);
            },this);            
        }
    }
});





