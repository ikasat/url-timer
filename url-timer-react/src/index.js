"use strict";
// ## import
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var ReactDOM = require("react-dom");
var Redux = require("redux");
var ReactRedux = require("react-redux");
var ReactRouter = require("react-router");
var ReactRouterDOM = require("react-router-dom");
var ConnectedReactRouter = require("connected-react-router");
var TypeScriptFSA = require("typescript-fsa");
var TypeScriptFSAReducers = require("typescript-fsa-reducers");
var Recompose = require("recompose");
var Formik = require("formik");
var History = require("history");
var luxon = require("luxon");
// ## Utilities
var baseURLPath = "/url-timer/";
var convertStringToTimestamp = function (s) {
    return s.match(/^[1-9][0-9]*$/) != null ? +s * 1000 : luxon.DateTime.fromISO(s).toMillis();
};
var convertTimestampToString = function (ts) { return luxon.DateTime.fromMillis(ts).toISO(); };
var convertDurationToString = function (d) {
    return luxon.Duration.fromMillis(Math.abs(d))
        .shiftTo("years", "months", "days", "minutes", "hours", "seconds")
        .toISO();
};
var getNow = function () { return Math.floor(Date.now() / 1000) * 1000; };
var initialTimerState = {
    nowTimestamp: getNow()
};
// ## Actions
var actionCreator = TypeScriptFSA.actionCreatorFactory("timer");
var setNowTimestamp = actionCreator("SET_NOW_TIMESTAMP");
var setNotificationEnabled = actionCreator("SET_NOTIFICATION_ENABLED");
var requestNotificationPermission = actionCreator.async("REQUEST_NOTIFICATION_PERMISSION");
// ## Reducers
var timerReducer = TypeScriptFSAReducers.reducerWithInitialState(initialTimerState)
    .case(setNowTimestamp, function (state, payload) { return (__assign({}, state, { nowTimestamp: payload })); })
    .case(setNotificationEnabled, function (state, payload) { return (__assign({}, state, { notificationEnabled: payload })); })
    .case(requestNotificationPermission.done, function (state, payload) { return (__assign({}, state, { notificationPermission: payload.result })); })
    .build();
var doRequestNotificationPermission = function (dispatch) { return __awaiter(_this, void 0, void 0, function () {
    var perm;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Notification.requestPermission()];
            case 1:
                perm = _a.sent();
                dispatch(requestNotificationPermission.done({ result: perm }));
                return [2 /*return*/];
        }
    });
}); };
var createRootReducer = function (history) {
    return Redux.combineReducers({
        router: ConnectedReactRouter.connectRouter(browserHistory),
        timer: timerReducer
    });
};
// ## Store
var browserHistory = History.createBrowserHistory({ basename: baseURLPath });
// Redux Devtools を使う
var composeEnhancers = (process.env.NODE_ENV === "development" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || Redux.compose;
var store = Redux.createStore(createRootReducer(browserHistory), composeEnhancers(Redux.applyMiddleware(ConnectedReactRouter.routerMiddleware(browserHistory))));
var TimerFormComponent = function (_a) { return (React.createElement(Formik.Form, null,
    React.createElement("ul", { style: { listStyleType: "none" } },
        React.createElement("li", null,
            React.createElement(Formik.Field, { type: "text", name: "targetTimeString", style: { width: 300 } })),
        React.createElement("li", null,
            React.createElement("button", { type: "submit", style: { width: 300 } }, "Create Timer"))))); };
var TimerFormContainer = Recompose.compose(ReactRedux.connect(function (_state) { return ({}); }, function (dispatch) { return ({ dispatch: dispatch }); }), Formik.withFormik({
    mapPropsToValues: function (_props) { return ({ targetTimeString: convertTimestampToString(getNow()) }); },
    handleSubmit: function (formData, _a) {
        var dispatch = _a.props.dispatch;
        var unixTime = Math.floor(convertStringToTimestamp(formData.targetTimeString) / 1000);
        if (!isNaN(unixTime)) {
            dispatch(ConnectedReactRouter.push("/" + unixTime));
        }
    }
}))(TimerFormComponent);
// #### Component
var TimerViewComponent = function (_a) {
    var targetTimestamp = _a.targetTimestamp, duration = _a.duration, targetTimeString = _a.targetTimeString;
    if (isNaN(targetTimestamp)) {
        return React.createElement(ReactRouterDOM.Link, { to: "/" }, "Reset");
    }
    return (React.createElement("div", { style: { textAlign: "center" } },
        React.createElement("h1", null, targetTimeString),
        React.createElement("h2", null,
            convertDurationToString(duration),
            React.createElement("span", { style: { fontSize: "80%" } }, duration >= 0 ? " (left)" : " (ago)")),
        React.createElement("div", { style: { marginTop: 5 } },
            React.createElement(ReactRouterDOM.Link, { to: "/" }, "Reset"))));
};
// #### Container
// ##### Properties
var TimerViewContainer = Recompose.compose(ReactRouterDOM.withRouter, ReactRedux.connect(function (_a) {
    var _b = _a.timer, nowTimestamp = _b.nowTimestamp, notificationEnabled = _b.notificationEnabled, notificationPermission = _b.notificationPermission;
    return ({
        nowTimestamp: nowTimestamp,
        notificationEnabled: notificationEnabled,
        notificationPermission: notificationPermission
    });
}, function (dispatch) { return ({
    dispatch: dispatch
}); }, function (stateProps, _a, ownProps) {
    var dispatch = _a.dispatch;
    var nowTimestamp = stateProps.nowTimestamp, notificationEnabled = stateProps.notificationEnabled, notificationPermission = stateProps.notificationPermission;
    var targetTimestamp = convertStringToTimestamp(ownProps.match.params.targetTimeString);
    var targetTimeString = convertTimestampToString(targetTimestamp);
    var duration = targetTimestamp - nowTimestamp;
    return __assign({}, stateProps, { dispatch: dispatch }, ownProps, { targetTimestamp: targetTimestamp,
        targetTimeString: targetTimeString,
        duration: duration,
        onTick: function () {
            var now = getNow();
            if (notificationEnabled && now >= targetTimestamp) {
                if (notificationPermission === "granted") {
                    var _notif = new Notification(targetTimeString);
                }
                dispatch(setNotificationEnabled(false));
            }
            dispatch(setNowTimestamp(now));
        } });
}), 
// ##### State / Lifecycle
Recompose.withState("timerId", "setTimerId", void 0), Recompose.lifecycle({
    componentDidMount: function () {
        var _a = this.props, onTick = _a.onTick, setTimerId = _a.setTimerId, dispatch = _a.dispatch, targetTimestamp = _a.targetTimestamp;
        setTimerId(window.setInterval(onTick, 500));
        onTick();
        dispatch(setNotificationEnabled(targetTimestamp > getNow()));
        doRequestNotificationPermission(dispatch);
    },
    componentWillUnmount: function () {
        clearInterval(this.props.timerId);
    }
}))(TimerViewComponent);
// ## Router
var App = function () { return (React.createElement(ReactRedux.Provider, { store: store },
    React.createElement(ConnectedReactRouter.ConnectedRouter, { history: browserHistory },
        React.createElement(ReactRouter.Switch, null,
            React.createElement(ReactRouter.Route, { path: "/", exact: true, component: TimerFormContainer }),
            React.createElement(ReactRouter.Route, { path: "/:targetTimeString", component: TimerViewContainer }))))); };
ReactDOM.render(React.createElement(App, null), document.getElementById("app"));
