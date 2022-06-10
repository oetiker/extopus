/* ************************************************************************
   Copyright: 2009 OETIKER+PARTNER AG
   License:   GPL
   Authors:   Tobi Oetiker <tobi@oetiker.ch>
   Utf8Check: öï
************************************************************************ */
/**
 * @asset(ep/Avenir/*.woff)
 * @asset(ep/Avenir/*.woff2)
 */

/**
 * no special fonts for extopus
 */
qx.Theme.define("ep.theme.Font", {
    extend: qx.theme.tangible.Font,
    fonts: {
        default: {
            size: 14,
            family: ["sans-serif"],
            color: "text-primary-on-surface",
            sources: [
                {
                    family: "AvenirNext",
                    source: [
                        "ep/Avenir/AvenirNextLTW05-Regular.woff2",
                        "ep/Avenir/AvenirNextLTW05-Regular.woff",
                    ]
                }
            ]
        },

        bold: {
            size: 14,
            family: ["sans-serif"],
            bold: true,
            color: "text-primary-on-surface",
            sources: [
                {
                    family: "AvenirNext",
                    source: [
                        "ep/Avenir/AvenirNextLTW05-Bold.woff2",
                        "ep/Avenir/AvenirNextLTW05-Bold.woff",
                    ]
                }
            ]
        },

        headline: {
            size: 24,
            family: ["sans-serif"],
            color: "text-primary-on-surface",
            sources: [
                {
                    family: "AvenirNext",
                    source: [
                        "ep/Avenir/AvenirNextLTW05-Regular.woff2",
                        "ep/Avenir/AvenirNextLTW05-Regular.woff",
                    ]
                }
            ]
        },
        small: {
            size: 12,
            family: ["sans-serif"],
            color: "text-primary-on-surface",
            sources: [
                {
                    family: "AvenirNext",
                    source: [
                        "ep/Avenir/AvenirNextLTW05-Regular.woff2",
                        "ep/Avenir/AvenirNextLTW05-Regular.woff",
                    ]
                }
            ]
        }
    }
});
