import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Redux from "redux";
import * as ReactRedux from "react-redux";
import * as ReduxForm from "redux-form";
import * as ReactRouter from "react-router";
import * as ReactRouterDOM from "react-router-dom";
import * as ConnectedReactRouter from "connected-react-router";
import * as TypeScriptFSA from "typescript-fsa";
import * as TypeScriptFSAReducers from "typescript-fsa-reducers";
import * as Recompose from "recompose";
import * as History from "history";
import * as luxon from "luxon";

// ■ 環境設定

const baseURLPath = "/url-timer/";

// ■ ユーティリティ関数

const convertStringToTimestamp = (s: string) =>
  s.match(/^[1-9][0-9]*$/) != null ? +s * 1000 : luxon.DateTime.fromISO(s).toMillis();
const convertTimestampToString = (ts: number) => luxon.DateTime.fromMillis(ts).toISO();
const convertDurationToString = (d: number) =>
  luxon.Duration.fromMillis(Math.abs(d))
    .shiftTo("years", "months", "days", "minutes", "hours", "seconds")
    .toISO();
const getNow = () => Math.floor(Date.now() / 1000) * 1000;

// ■ State

type TimerState = {
  nowTimestamp: number;
};
const initialTimerState: TimerState = {
  nowTimestamp: getNow()
};

type State = {
  timer: TimerState;
  form: ReduxForm.FormStateMap;
  router: ConnectedReactRouter.RouterState;
};

// ■ Actions

const actionCreator = TypeScriptFSA.actionCreatorFactory("timer");
const changeNowTimestamp = actionCreator<number>("CHANGE_NOW_TIMESTAMP");

// ■ Reducers

const timerReducer = TypeScriptFSAReducers.reducerWithInitialState(initialTimerState)
  .case(changeNowTimestamp, (timerState, payload) => ({ ...timerState, nowTimestamp: payload }))
  .build();

const reducer = Redux.combineReducers({
  timer: timerReducer,
  form: ReduxForm.reducer
});

// ■ Store

const browserHistory = History.createBrowserHistory({ basename: baseURLPath });

// Redux Devtools を使う
// tslint:disable-next-line:no-any
const composeEnhancers: typeof Redux.compose = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || Redux.compose;

const store = Redux.createStore(
  ConnectedReactRouter.connectRouter(browserHistory)(reducer),
  composeEnhancers(Redux.applyMiddleware(ConnectedReactRouter.routerMiddleware(browserHistory)))
);

// ■ Components / Containers

// TimerFormComponent / Container

type TimerFormData = {
  targetTimeString?: string; // form から取得するパラメータ (redux-form)
};
type TimerFormOwnProps = {};
type TimerFormStateProps = {
  initialValues?: TimerFormData; // (redux-form)
};
type TimerFormDispatchProps = {
  onSubmit(formData: TimerFormData): void; // (redux-form)
};
type TimerFormMergedProps = TimerFormOwnProps & TimerFormStateProps & TimerFormDispatchProps;
type TimerFormInjectedFormProps = ReduxForm.InjectedFormProps<TimerFormData, {}>;
type TimerFormProps = TimerFormMergedProps & TimerFormInjectedFormProps;

const TimerFormComponent = ({ handleSubmit }: TimerFormProps) => (
  <form onSubmit={handleSubmit}>
    <ul style={{ listStyleType: "none" }}>
      <li>
        <ReduxForm.Field component="input" type="text" name="targetTimeString" style={{ width: 300 }} />
      </li>
      <li>
        <button style={{ width: 300 }}>Create URL Timer</button>
      </li>
    </ul>
  </form>
);

const TimerFormContainer = Recompose.compose<TimerFormProps, {}>(
  ReactRedux.connect(
    (_state: State): TimerFormStateProps => ({ initialValues: { targetTimeString: luxon.DateTime.local().toISO() } }),
    (dispatch: Redux.Dispatch): TimerFormDispatchProps => ({
      onSubmit(formData: TimerFormData) {
        if (formData.targetTimeString != null) {
          const unix = Math.floor(convertStringToTimestamp(formData.targetTimeString) / 1000);
          if (!isNaN(unix)) {
            dispatch(ConnectedReactRouter.push(`/${unix}`));
          }
        }
      }
    })
  ),
  ReduxForm.reduxForm({ form: "timerFormContainer" })
)(TimerFormComponent);

// TimerViewComponent / Container

type TimerViewPathParams = {
  targetTimestamp?: string; // URL (Path) から取得するパラメータ (react-router)
};
type TimerViewInjectedRouterProps = ReactRouter.RouteComponentProps<TimerViewPathParams>;
type TimerViewOwnProps = TimerViewInjectedRouterProps;
type TimerViewStateProps = {
  nowTimestamp: number;
};
type TimerViewDispatchProps = {
  onTick(): void;
};
type TimerViewMergedProps = TimerViewOwnProps & TimerViewStateProps & TimerViewDispatchProps;
type TimerViewInjectedStateProps = Recompose.stateProps<number | undefined, "timerId", "setTimerId">;
type TimerViewProps = TimerViewMergedProps & TimerViewInjectedStateProps;

const TimerViewComponent = ({ nowTimestamp, match }: TimerViewProps) => {
  const targetTimestamp = +(match.params.targetTimestamp || "") * 1000;
  if (isNaN(targetTimestamp)) {
    return <ReactRouterDOM.Link to="/">Reset</ReactRouterDOM.Link>;
  }
  const duration = targetTimestamp - nowTimestamp;
  return (
    <div style={{ textAlign: "center" }}>
      <h1>{convertTimestampToString(targetTimestamp)}</h1>
      <h2>
        {convertDurationToString(duration)}
        <span style={{ fontSize: "80%" }}>{duration >= 0 ? " (left)" : " (ago)"}</span>
      </h2>
      <div style={{ marginTop: 5 }}>
        <ReactRouterDOM.Link to="/">Reset</ReactRouterDOM.Link>
      </div>
    </div>
  );
};

const TimerViewContainer = Recompose.compose<TimerViewProps, {}>(
  ReactRouterDOM.withRouter,
  ReactRedux.connect(
    ({ timer: { nowTimestamp } }: State): TimerViewStateProps => ({ nowTimestamp }),
    (dispatch: Redux.Dispatch): TimerViewDispatchProps => ({
      onTick() {
        dispatch(changeNowTimestamp(getNow()));
      }
    })
  ),
  Recompose.withState("timerId", "setTimerId", void 0),
  Recompose.lifecycle<TimerViewProps, {}>({
    componentDidMount() {
      const { onTick, setTimerId } = this.props;
      setTimerId(window.setInterval(onTick, 500));
      onTick();
    },
    componentWillUnmount() {
      clearInterval(this.props.timerId);
    }
  })
)(TimerViewComponent);

// App

const App = () => (
  <ReactRedux.Provider store={store}>
    <ConnectedReactRouter.ConnectedRouter history={browserHistory}>
      <ReactRouter.Switch>
        <ReactRouter.Route path="/" exact={true} component={TimerFormContainer} />
        <ReactRouter.Route path="/:targetTimestamp" component={TimerViewContainer} />
        <ReactRouter.Route>
          <p>Not found.</p>
        </ReactRouter.Route>
      </ReactRouter.Switch>
    </ConnectedReactRouter.ConnectedRouter>
  </ReactRedux.Provider>
);

ReactDOM.render(<App />, document.getElementById("app") as HTMLElement);
