/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

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
        var plus = new qx.ui.form.MenuButton(null,"@MaterialIcons/add/22",this).set({
            //margin: [4,4,4,4],
            appearance: "menubar-button",
            center: true,
            show: 'icon' 
        });
        this._menuCache = {};
        this._menuBusy = new qx.ui.menu.Button("Updating Dashlist","@MaterialIcons/sync/16").set({
            enabled: false
        });
        this._noDashboards = new qx.ui.menu.Button("No Dashboards found").set({
            enabled: false
        });
        this.addListener('changeVisibility',function(e){
            var vis = e.getData();
            if (vis == 'visible'){
                this._updateMenu();
            }
        },this);
        /* make sure the view menu is initialized and can track dashboards as they are added */ 
        ep.ui.ViewMenu.getInstance();
        this._menuItemCache = {};
        
    },
    members: {
        _lastUpdate: null,
        _menuItemCache: null,
        _updateing: false,
        _menuBusy: null,
        _noDashboards: null,
        _updateMenu: function(){
            var rpc = ep.data.Server.getInstance();        
            var menu = this;
            var cache = this._menuCache;
            if (this._updateing){
                return;
            }
            this._updateing = true;
            var savedKids = menu.removeAll();
            menu.add(this._menuBusy);
            let that = this;
            rpc.callAsyncSmart(function(ret){
                var libMenu;
                var libMenuButton;
                var loginMenus = {};
                var updateMenu = false;
                var itemIdCheck = {};
                menu._updateing = false;
                var gotItems = false;
                ret.forEach(function(item){
                    itemIdCheck[item.id] = true;
                    if (item.up){
                        updateMenu = true;
                        menu._menuItemCache[item.id] = item;
                    }
                    gotItems = true;
                });
                menu.removeAll();
                if (! gotItems){
                    menu.add(that._noDashboards);
                    return;
                }
                // remove deleted items
                for (var key in menu._menuItemCache){
                    var item = menu._menuItemCache[key];
                    if (!itemIdCheck[key]){
                        delete menu._menuItemCache[key];
                        updateMenu = true;
                    }
                }
                if (! updateMenu ){
                    savedKids.forEach(function(kid){
                        menu.add(kid);
                    });
                    return;
                }
                for (var key in menu._menuItemCache){
                    var item = menu._menuItemCache[key];
                    var button = menu._makeButton(menu,item);
                    if (item.mine){
                        menu.add(button);
                        continue;
                    }
                    if (!libMenu ){
                        libMenu = new qx.ui.menu.Menu;
                        libMenuButton = new qx.ui.menu.Button(menu.tr("Library"),null,null,libMenu);
                    }
                    if (!loginMenus[item.login]){
                        loginMenus[item.login] = new qx.ui.menu.Menu;
                        libMenu.add(
                            new qx.ui.menu.Button(
                                item.login,null, null,loginMenus[item.login]
                            )
                        );
                    }
                    // adding the same item twice removes it from the menu
                    loginMenus[item.login].add(button);
                }
                if (libMenu){
                    menu.add(libMenuButton);
                }
            },'getDashList',this._lastUpdate);
        },
        _onOpen: function(e){
            var button = e.getTarget();
            var item = button.getUserData('item');
            var dashMgr = ep.ui.DashManager.getInstance();
            var board = dashMgr.newBoard(item.mine ? item.lb : item.lb + ' ('+item.login+')');
            var cache = this._menuCache;
            board.set({
                dashId: item.id,
                updateTime: item.up,
                readOnly: item.mine ? false : true
            });
            item.cfg.forEach(function(viz){
                board.addVisualizer(viz.cfg,viz.position);
            },this);            
        },
        _makeButton: function(menu,item){
            var dashMgr = ep.ui.DashManager.getInstance();
            var button = new qx.ui.menu.Button(item.lb).set({
                label: item.lb,
                enabled: !dashMgr.isBoardOpen(item.id) 
            });
            button.addListener('execute',menu._onOpen,menu);
            if (item.up > menu._lastUpdate){
                menu._lastUpdate = item.up
            }
            button.setUserData('item',item);
            return button;
        }
    }
});





