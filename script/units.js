var units = {
    errors: [],

    // Load army special rules
    loadSpecialRules: function () {
        return $.getJSON("lists/specialRules.json").then(function (data) {
            specialRules = {};

            data.rules.forEach(function (rule) {
                specialRules[rule.title] = rule;
            });

            return specialRules;
        });
    },

    // Load weapons & weapon rules
    loadWeapons: function () {
        return $.getJSON("lists/weapons.json").then(function (data) {
            rules = {};
            weapons = {};

            data.rules.forEach(function (rule) {
                rules[rule.name] = rule;
            });

            data.weapons.forEach(function (item) {
                item.modes.forEach(function (mode) {
                    if (mode.specialRules) {
                        mode.specialRules = mode.specialRules.map(function (sRule) {
                            if (rules[sRule]) {
                                return rules[sRule];
                            } else {
                                error("Unknown special rule '" + sRule + "' for weapon: " + item.name);
                                return {
                                    "name": "ERROR",
                                    "description": "Unknown special rule " + sRule
                                }
                            }
                        })
                    }
                });
                weapons[item.name] = item;
            });

            return {
                rules, weapons
            };
        });
    },

    formatSpecialRules: function (data, specialRules) {
        data.specialRules = data.specialRules.map(function (rule) {
            if (typeof rule === 'string') {
                if (specialRules[rule]) {
                    return specialRules[rule];
                } else {
                    error("Unknown army special rule '" + rule + "'");
                }
            } else {
                return rule;
            }
        });

        return data;
    },

    formatUnits: function (data, specialRules, weapons) {
        unitSections = [];

        typeSort = function (type) {
            switch (type) {
                case "CH": return 0;
                case "INF": return 1;
                case "LV": return 2;
                case "AV": return 3;
                case "H-AV": return 4;
                case "WE": return 5;
                case "AC": return 6;
                case "AC/WE": return 7;
                case "SC": return 8;
                default: return 9;
            }
        }

        data.units.forEach(function (unitSection) {
            $.ajax("lists/" + unitSection.from, {
                async: false,
                success: function (units) {
                    units.forEach(function (section) {
                        section.unit = section.unit.filter(function (unit) {
                            return unitSection.units.includes(unit.name);
                        });

                        section.unit.sort(function (a, b) {
                            typeSortNumber = typeSort(a.type) - typeSort(b.type)

                            if (typeSortNumber !== 0) {
                                return typeSortNumber
                            } else {
                                return a.name.localeCompare(b.name)
                            }
                        })

                        section.unit.forEach(function (unit) {
                            unit.weapons = unit.weapons.map(weapon => replaceWeapon(weapon, weapons, unit));
                        });

                        section.specialRules.forEach(function (rule) {
                            specialRules[rule.title] = rule
                        })

                        section.specialRules = unitSection.unitRules.map(function (rule) {
                            if (specialRules[rule] !== undefined) {
                                return specialRules[rule]
                            } else {
                                return {
                                    "name": "ERROR",
                                    "description": "Unknown special rule: " + rule
                                }
                            }
                        })
                    });

                    unitSections.push(units);
                }
            });
        });

        return unitSections;
    },
};

function error(message) {
    units.errors.push(message);
    console.error(message);
}

function replaceWeapon(weapon, weapons, unit) {
    if (typeof weapon === 'string') {
        var values = weapon.split('|');

        if (!weapons.weapons[values[0]]) {
            error("Unknown weapon '" + values[0] + "' for unit: " + unit.name);

            return {
                "name": "ERROR",
                "modes": [{
                    "firepower": "ERROR"
                }]
            }
        }

        var weaponObject = JSON.parse(JSON.stringify(weapons.weapons[values[0]]));

        // More than one weapon
        if (values.length > 1 && values[1]) {
            weaponObject.count = values[1];
        }

        // Extra special rules
        if (values.length > 2 && values[2]) {
            weaponObject.modes.forEach(function (mode) {
                if (!mode.specialRules) {
                    mode.specialRules = [];
                }

                if (weapons.rules[values[2]]) {
                    mode.specialRules.push(weapons.rules[values[2]]);
                } else {
                    error("Unknown special rule '" + values[2] + "' for weapon: " + weaponObject.name +
                        ", on unit: " + unit.name);
                    mode.specialRules.push({"name": "ERROR", "description": "Unknown special rule: " + values[2]});
                }
            });
        }

        if (weaponObject === null) {
            console.log("Undefined weapon, values ", values);
        }
        return weaponObject;
    } else {
        return weapon;
    }
}
