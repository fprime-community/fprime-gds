/**
 * vue-support/event.js:
 *
 * Event listing support for F´ that sets up the Vue.js components used to display events. These components allow the
 * user to render events. This file also provides EventMixins, which are the core functions needed to convert events to
 * something Vue.js can display. These should be mixed with any F´ objects wrapping Vue.js component creation.
 *
 * @author mstarch
 */
import {listExistsAndItemNameNotInList, timeToString} from "./utils.js";
import {_datastore,_dictionaries} from "../datastore.js";

let OPREG = /Opcode (0x[0-9a-fA-F]+)/;

/**
 * events-list:
 *
 * Renders lists as a colorized table. This is a thin-wrapper to pass events to the fp-table component. It supplies the
 * needed method to configure fp-table to render events.
 */
Vue.component("event-list", {
    props: {
        /**
         * fields:
         *
         * Fields to display on this object. This should be null, unless the user is specifically trying to minimize
         * this object's display.
         */
        fields: {
            type: [Array, String],
            default: ""
        },
        /**
         * The search text to initialize the table filter with (defaults to
         * nothing)
         */
        filterText: {
            type: String,
            default: ""
        },
        /**
         * A list of item ID names saying what rows in the table should be
         * shown; defaults to an empty list, meaning "show all items"
         */
        itemsShown: {
            type: [Array, String],
            default: ""
        },
        /**
         * 'compact' allows the user to hide filters/buttons/headers/etc. to
         * only show the table itself for a cleaner view
         */
        compact: {
            type: Boolean,
            default: false
        }
    },
    data: function() {
        return {
            // NOTE: Events/command lists shared across all component instances
            "events": _datastore.events,
            "commands": _datastore.commands,
        };
    },
    template: "#event-list-template",
    methods: {
        /**
         * Takes in a given event item, and harvests out the column values for display in the fp-table.
         * @param item: event object to harvest
         * @return {[string, *, *, void | string, *]}
         */
        columnify(item) {
            let template = _dictionaries.events[item.id];
            let display_text = item.display_text;
            // Remap command EVRs to expand opcode for visualization purposes
            let groups = null;
            if (template.severity.value === "EventSeverity.COMMAND" && (groups = display_text.match(OPREG)) != null) {
                let id = parseInt(groups[1]);
                let command_mnemonic = (_dictionaries.commands_by_id[id] || {}).full_name || "UNKNOWN";
                const msg = '<span title="' + groups[0] + '">' + command_mnemonic + '</span>'
                display_text = display_text.replace(OPREG, msg);
            }
            return [timeToString(item.datetime || item.time), "0x" + item.id.toString(16), template.full_name,
                template.severity.value.replace("EventSeverity.", ""), display_text];
        },
        /**
         * Use the row's values and bounds to colorize the row. This function will color red and yellow items using
         * the boot-strap "warning" and "danger" calls.
         * @param item: item passed in with which to calculate style
         * @return {string}: style-class to use
         */
        style(item) {
            let template = _dictionaries.events[item.id];
            let severity = {
                "EventSeverity.FATAL":      "fp-color-fatal",
                "EventSeverity.WARNING_HI": "fp-color-warn-hi",
                "EventSeverity.WARNING_LO": "fp-color-warn-lo",
                "EventSeverity.ACTIVITY_HI": "fp-color-act-hi",
                "EventSeverity.ACTIVITY_LO": "fp-color-act-lo",
                "EventSeverity.COMMAND":     "fp-color-command",
                "EventSeverity.DIAGNOSTIC":  ""
            };
            return severity[template.severity.value];
        },
        /**
         * Take the given item and converting it to a unique key by merging the id and time together with a prefix
         * indicating the type of the item. Also strip spaces.
         * @param item: item to convert
         * @return {string} unique key
         */
        keyify(item) {
            return "evt-" + item.id + "-" + item.time.seconds + "-"+ item.time.microseconds + "-" + item.incremental_id;
        },
        /**
         * A function to clear events out of the data store. This is to reset the events entirely.
         */
        clearEvents() {
            _datastore.events.splice(0, _datastore.events.length);
        },
        /**
         * Returns if the given item should be hidden in the data table; by
         * default, shows all items. If the "itemsShown" property is set, only
         * show items with the given names
         *
         * @param item: The given F' data item
         * @return {boolean} Whether or not the item is shown
         */
        isItemHidden(item) {
            return listExistsAndItemNameNotInList(this.itemsShown, item);
        }
    }
});
