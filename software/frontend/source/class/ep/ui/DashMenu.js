/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */
/*
#asset(ep/view-*.png)
*/

/**
 * The Dashboard Menu
 */

qx.Class.define("ep.ui.DashMenu", {
    extend: qx.ui.menu.Menu,
    type: 'singleton',

    construct : function() {
        this.base(arguments);
        var btn = [
            [ 'ren',this.tr("Rename Tab"),   null, function(e){ this._board.editLabel(); }],
            [ 'edt',this.tr("Edit Board"),   null, function(e){ this._board.fireEvent.call(this._board,'startEditMode'); }],
            [ 'rm',this.tr("Remove Tab"),    null, function(e){ this._board.fireEvent.call(this._board,'close'); }]
        ];
        var menuBtn = {};
        btn.forEach(function(item){
            var bt = menuBtn[item[0]] = new qx.ui.menu.Button(item[1],item[2]);
            if (item[3]){
                bt.addListener('execute',item[3],this);
            }
            this.add(bt);
        },this);
    },
    members: {
        _board: null,
        /**
         * Show the dashBoard menu at the given widget position
         * 
         * @param widget {Widget} widget for positioning the menu
         */
        showMenu: function(button,board){
            this._board = board;
            this.setOpener(button);
            qx.ui.menu.Manager.getInstance().hideAll();
            this.open();
        }
    }
});
