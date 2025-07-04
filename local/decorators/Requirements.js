"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Requirements = Requirements;
exports.getRequirements = getRequirements;
require("reflect-metadata");
function Requirements(_a) {
    var args = __rest(_a, []);
    return function (target, propertyKey) {
        Reflect.defineMetadata(propertyKey, Object.assign({}, args), target);
    };
}
function getRequirements(propertyKey, target) {
    let out = {};
    out = Reflect.getMetadata(propertyKey, target);
    return out;
}
//# sourceMappingURL=Requirements.js.map