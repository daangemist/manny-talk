var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import BrainSelector from '../../../src/brain-selector';
function setupBrainSelector(stickyness) {
    if (stickyness === void 0) { stickyness = 120; }
    var brainSelector = new BrainSelector('default', stickyness);
    return brainSelector;
}
describe('getBrainForInput', function () {
    it('should fallback to the default brain', function () { return __awaiter(void 0, void 0, void 0, function () {
        var brainSelector, brainMock, brain;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    brainSelector = setupBrainSelector();
                    brainMock = { process: jest.fn() };
                    brainSelector.setBrains({ default: brainMock });
                    return [4 /*yield*/, brainSelector.getBrainForInput({
                            message: 'heard',
                            plugin: 'test',
                        })];
                case 1:
                    brain = (_a.sent()).brain;
                    expect(brain).toBe(brainMock);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should use a sticky brain if there is one for the client', function () { return __awaiter(void 0, void 0, void 0, function () {
        var stickyBrain, stickySelector, brainSelector, defaultBrain, brain, secondBrain;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    stickyBrain = { process: jest.fn() };
                    stickySelector = jest.fn();
                    stickySelector.mockResolvedValue({ brain: stickyBrain });
                    brainSelector = setupBrainSelector();
                    brainSelector.use('sticky', stickySelector);
                    defaultBrain = { process: jest.fn() };
                    brainSelector.setBrains({ default: defaultBrain, sticky: stickyBrain });
                    return [4 /*yield*/, brainSelector.getBrainForInput({
                            message: 'heard',
                            plugin: 'test',
                        })];
                case 1:
                    brain = (_a.sent()).brain;
                    expect(stickySelector).toBeCalled();
                    expect(brain).toBe(stickyBrain);
                    return [4 /*yield*/, brainSelector.getBrainForInput({
                            message: 'heard 2',
                            plugin: 'test',
                        })];
                case 2:
                    secondBrain = (_a.sent()).brain;
                    expect(secondBrain).toEqual(stickyBrain);
                    expect(stickySelector).toHaveBeenCalledTimes(2);
                    return [2 /*return*/];
            }
        });
    }); });
    it('should not use a sticky brain if it is outdated', function () { return __awaiter(void 0, void 0, void 0, function () {
        var stickyBrain, stickySelector, brainSelector, defaultBrain, brain, secondBrain;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    stickyBrain = { process: jest.fn() };
                    stickySelector = jest.fn();
                    stickySelector.mockResolvedValueOnce({ brain: stickyBrain });
                    // Make sure that one the second invocation sticky brain is not selected by this selector.
                    stickySelector.mockResolvedValue(false);
                    brainSelector = setupBrainSelector(-1);
                    brainSelector.use('sticky', stickySelector);
                    defaultBrain = { process: jest.fn() };
                    brainSelector.setBrains({ default: defaultBrain, sticky: stickyBrain });
                    return [4 /*yield*/, brainSelector.getBrainForInput({
                            message: 'heard',
                            plugin: 'test',
                        })];
                case 1:
                    brain = (_a.sent()).brain;
                    expect(brain).toEqual(stickyBrain);
                    return [4 /*yield*/, brainSelector.getBrainForInput({
                            message: 'heard 2',
                            plugin: 'test',
                        })];
                case 2:
                    secondBrain = (_a.sent()).brain;
                    expect(secondBrain).toEqual(defaultBrain);
                    expect(stickySelector).toHaveBeenCalledTimes(2);
                    return [2 /*return*/];
            }
        });
    }); });
});
