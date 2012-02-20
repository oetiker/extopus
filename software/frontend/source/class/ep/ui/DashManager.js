/* ************************************************************************
   Copyright: 2011 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/**
 * The Dashboard Manager manages our Dashboards
 */

qx.Class.define("ep.ui.DashManager", {
    extend: qx.core.Object,
    type: 'singleton',

    construct : function() {
        this.base(arguments);
    },
    properties: {
        boardList: {
            init: []
        }
    },
    members: {
        /**
         * Add a new Board
         * 
         * @param name {String} name of the new board. If it is empty, ask.
         * @param dimension {Array} [minX, minY, maxX, maxY]
         */
        newBoard: function(name,dimension){
            var dt = ep.ui.Desktop.getInstance();
            var board = new ep.ui.DashBoard(name,dimension);
            var menu = ep.ui.ViewMenu.getInstance();
            menu.registerBoard(board);
            dt.addAt(board,2);
            dt.setSelection([board]);
            this.getBoardList().push(board);
            board.addListener('close',function(){
                this.setBoardList(this.getBoardList().filter(function(item){item !== board},this));
            },this);
            return board;
        }
    }
});
