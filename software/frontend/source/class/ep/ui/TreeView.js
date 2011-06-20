/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPLv3 or later
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: äöü
************************************************************************ */

/* ************************************************************************

#asset(qx/icon/${qx.icontheme}/22/places/folder.png)
#asset(qx/icon/${qx.icontheme}/22/mimetypes/office-spreadsheet.png)
#asset(ep/loading22.gif)

************************************************************************ */

/**
 * The Extopus node navigation tree with table and view areas.
 */
qx.Class.define("ep.ui.TreeView", {
    extend : qx.ui.core.Widget,

    /**
     * create a navigator tree view
     *
     * @param colDef {Map} column definitions
     * @param treeOpen {Integer} how many tree nodes to open initially
     * @return {void} 
     */
    construct : function(colDef, treeOpen) {
        this.__initial_open = treeOpen;
        this.base(arguments);
        this._setLayout(new qx.ui.layout.Grow());
        var hPane = new qx.ui.splitpane.Pane("horizontal");
        this._add(hPane);
        var vPane = new qx.ui.splitpane.Pane("vertical");
        vPane.add(this._createTable(colDef.names, colDef.ids, colDef.widths), 1);
        var tree = this._createTree();
        hPane.add(tree, parseInt(ep.data.FrontendConfig.getInstance().getConfig().tree_width));
        this._openTree(tree, tree.getModel(), true);
        hPane.add(vPane, 30);
        vPane.add(new ep.ui.View(this.getTable()), 3);
    },

    properties : {
        /**
         * tree widget
         */
        tree  : {},
        /**
         * table widget
         */
        table : {}
    },

    members : {
        __initial_open : null,


        /**
         * Open the tree
         *
         * @param tree {Widget} tree widget
         * @param node {Node} tree node model object
         * @param first {Boolean} is this the first time we decend
         * @return {void} 
         */
        _openTree : function(tree, node, first) {
            if (!node.getKids) {
                if (first) {
                    var sel = tree.getSelection();
                    sel.removeAll();
                    sel.push(node);
                }

                return;
            }

            if (!node.getLoaded()) {
                if (this.__initial_open < 0) {
                    return;
                }

                node.addListenerOnce('changeLoaded', function() {
                    this._openTree(tree, node, first);
                }, this);

                this.__initial_open--;
                tree.openNode(node);
                return;
            }

            if (node.getKids) {
                if (!tree.isNodeOpen(node)) {
                    tree.openNode(node);
                }

                var kids = node.getKids();

                for (var k=0; k<kids.length; k++) {
                    this._openTree(tree, kids.getItem(k), first && k == 0);
                }
            }
        },


        /**
         * Create the tree widget with incremental loading
         *
         * @return {Widget} the tree widget
         */
        _createTree : function() {
            var root = qx.data.marshal.Json.createModel({
                name   : 'root',
                kids   : [],
                leaves : null,
                icon   : 'default',
                loaded : false,
                nodeId : 0
            },
            true);

            this._addNodeKids(root);
            var that = this;

            var control = new qx.ui.tree.VirtualTree(root, 'name', 'kids').set({
                openMode : 'click',
                hideRoot : true,
                iconPath : 'icon',

                iconOptions : {
                    converter : function(value, model) {
                        if (value == "default") {
                            if (model.getKids != null) {
                                return "icon/22/places/folder.png";
                            } else {
                                return "icon/22/mimetypes/office-spreadsheet.png";
                            }
                        }
                        else {
                            return "ep/loading22.gif";
                        }
                    }
                },

                delegate : {
                    bindItem : function(controller, item, index) {
                        controller.bindDefaultProperties(item, index);

                        controller.bindProperty("", "open", {
                            converter : function(value, model, source, target) {
                                var isOpen = target.isOpen();

                                if (isOpen && !value.getLoaded()) {
                                    that._addNodeKids(value);
                                }

                                return isOpen;
                            }
                        },
                        item, index);
                    }
                }
            });

            control.getSelection().addListener("change", this._setLeavesTable, this);
            this.setTree(control);
            return control;
        },


        /**
         * Create the table widget for showing the nodes matching the selected tree leaf.
         *
         * @param names {Array} column names
         * @param ids {Array} column ids
         * @param widths {Array} column widths
         * @return {Widget} table widget
         */
        _createTable : function(names, ids, widths) {
            var tm = new qx.ui.table.model.Simple();
            tm.setColumns(names, ids);
            var control = new ep.ui.Table(tm, widths);
            this.setTable(control);
            return control;
        },


        /**
         * Add new nodes to the tree
         *
         * @param node {Node} node to add the new nodes to
         * @return {void} 
         */
        _addNodeKids : function(node) {
            var rpc = ep.data.Server.getInstance();

            rpc.callAsyncSmart(function(ret) {
                var kids = node.getKids();
                kids.removeAll();

                ret.forEach(function(branch) {
                    var newNode = {
                        nodeId : branch[0],
                        name   : branch[1],
                        icon   : 'default',
                        loaded : false,
                        leaves : null
                    };

                    if (branch[2]) {
                        newNode.kids = [ {
                            name : 'Loading',
                            icon : 'loading'
                        } ];
                    }

                    var kid = qx.data.marshal.Json.createModel(newNode, true);

                    // keep the data array as a normal array and don't have it qooxdooified
                    kid.setLeaves(branch[3]);
                    kids.push(kid);
                });

                node.setLoaded(true);
            },
            'getBranch', node.getNodeId());
        },


        /**
         * Load data into the leaf table
         *
         * @param e {Event} selection event
         * @return {void} 
         */
        _setLeavesTable : function(e) {
            var sel = this.getTree().getSelection();

            if (sel.length > 0) {
                var table = this.getTable();
                var tm = table.getTableModel();
                var sm = table.getSelectionModel();
                var data = sel.getItem(0).getLeaves();
                table.resetSelection();
                tm.setData(data);

                if (data.length) {
                    sm.setSelectionInterval(0, 0);
                }
            }
        }
    }
});
