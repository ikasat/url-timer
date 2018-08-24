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
import * as Reselect from "reselect";
import * as History from "history";

// 時刻は moment、時間は moment-duration-format で扱う
import moment from "moment";
import momentDurationFormat from "moment-duration-format";
momentDurationFormat(moment);

// 環境設定
const baseURLPath = "/";

// ユーティリティ関数
const defaultString = (s: string | null | undefined, defaultS: string = "") => (s == null ? defaultS : s);
const isBlank = (s: string | null | undefined) => (s == null || s === "");
function nullablify<T, R>(f: (x: T) => R): (x: T | undefined) => R | undefined {
  return (x: T | undefined) => (x == null ? void(0) : f(x));
}
const decodeURIComponentIfNotNull = nullablify(decodeURIComponent);
const timeStringToTimestamp = (s: string): number | undefined => {
  const m = moment(s, [moment.ISO_8601, "HH:mm", "X"]);
  const timestamp = parseInt(s);
  if (m.isValid()) {
    return m.unix();
  } else {
    return isNaN(timestamp) ? void(0) : timestamp;
  }
}

// State
type State = {
  timer: TimerState;
  form: ReduxForm.FormStateMap;
  router: ConnectedReactRouter.RouterState;
}

type TimerState = {
  nowTimestamp: number;
  targetTimeString?: string;
  targetTimestamp?: number;
}

const initialTimerState: TimerState = {
  nowTimestamp: moment().unix()
};

// Action
const actionCreator = TypeScriptFSA.actionCreatorFactory();
const changeNowTimestamp = actionCreator<number>("timer/CHANGE_NOW_TIMESTAMP");
const changeTargetTime = actionCreator<{string?: string, timestamp?: number}>("timer/CHANGE_TARGET_TIME");

// Reducer
const timerReducer = TypeScriptFSAReducers.reducerWithInitialState(initialTimerState)
  .case(changeNowTimestamp, (timerState, payload) => ({ ...timerState, nowTimestamp: payload }))
  .case(changeTargetTime, (timerState, { string, timestamp }) => ({ ...timerState, targetTimeString: string, targetTimestamp: timestamp }))
  .build();

const reducer = Redux.combineReducers({
  timer: timerReducer,
  form: ReduxForm.reducer
});

// Store
const browserHistory = History.createBrowserHistory({ basename: baseURLPath });

// Redux Devtools を使う
const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || Redux.compose;

const store = Redux.createStore(
  ConnectedReactRouter.connectRouter(browserHistory)(reducer),
  composeEnhancers(Redux.applyMiddleware(ConnectedReactRouter.routerMiddleware(browserHistory)))
);

// Props 定義

// URL (Path) に含まれるパラメータ (react-router)
interface PathParams {
  targetTimeString?: string;
}

// form 要素を使ったパラメータ (redux-form)
interface FormData {
  targetTimeString?: string;
}

// redux-form と react-router(-dom) によって注入される Props
interface OwnProps extends ReduxForm.InjectedFormProps<FormData, {}>, ReactRouter.RouteComponentProps<PathParams> {}

// mapStateToProps が生成する Props
interface StateProps {
  initialValues?: FormData;  // redux-form が使う
  nowTimestamp: number;
  nowTimeString: string;
  targetTimestamp?: number;
  targetTimeString?: string;
  targetTimeISOString?: string;
  duration?: number;
  durationString?: string;
}

// mapDispatchToProps が生成する Props
interface DispatchProps {
  onSubmit(formData: FormData): void;
  onChangeTargetTimeString(targetTimeString: string | undefined): void;
}

// mergeProps（あれば）が生成する Props
type Props = OwnProps & StateProps & DispatchProps;

// state からデータを抽出するセレクタ
const selectLocation = (state: State) => state.router.location;
const selectNowTimestamp = (state: State) => state.timer.nowTimestamp;
const selectTargetTimeString = (state: State) => state.timer.targetTimeString;
const selectTargetTimestamp = (state: State) => state.timer.targetTimestamp;

// state 中の関心のある値が更新された場合のみ新しい StateProps を生成する (reselect)
const reselectProps = Reselect.createSelector(
  [selectLocation, selectNowTimestamp, selectTargetTimeString, selectTargetTimestamp],
  (_location, nowTimestamp, targetTimeString, targetTimestamp): StateProps => {
    const nowTimeString = moment.unix(nowTimestamp).toISOString(true);
    if (targetTimestamp == null) {
      return {
        initialValues: { targetTimeString: moment().toISOString(true) },
        nowTimestamp,
        nowTimeString
      };
    }
    const targetTimeISOString = moment.unix(targetTimestamp).toISOString(true);
    const duration = targetTimestamp - nowTimestamp;
    const durationString = moment.duration(duration * 1000).format("d[d]hh:mm:ss");
    return {
      initialValues: { },
      nowTimestamp,
      nowTimeString,
      targetTimestamp,
      targetTimeString,
      targetTimeISOString,
      duration,
      durationString,
    };
  }
);

const mapStateToProps = (state: State) => reselectProps(state);

const mapDispatchToProps = (dispatch: Redux.Dispatch): DispatchProps => ({
  onSubmit({ targetTimeString: maybeTargetTimeString }: FormData) {
    const targetTimeString = defaultString(maybeTargetTimeString);
    dispatch(ConnectedReactRouter.push(encodeURIComponent(targetTimeString)));
  },
  onChangeTargetTimeString(targetTimeString: string | undefined) {
    if (targetTimeString != null) {
      dispatch(changeTargetTime({ string: targetTimeString, timestamp: timeStringToTimestamp(targetTimeString) }));
    } else {
      dispatch(changeTargetTime({ string: undefined, timestamp: undefined }));
    }
  }
});

// Component
const TimerComponent = (props: Props) => {
  const { handleSubmit, onSubmit, nowTimestamp, nowTimeString, targetTimestamp, targetTimeString, targetTimeISOString, duration, durationString } = props;
  return (
    <div style={{textAlign: "center"}}>
      <p>(Now: { nowTimeString }, { nowTimestamp })</p>
      {
        targetTimeString == null
          ? <React.Fragment />
          : (
            <React.Fragment>
              <h1>
                {targetTimeString}<br />
                <span style={{fontSize: "50%"}}>({targetTimeISOString}, {targetTimestamp})</span>
              </h1>
              <h2>
                {defaultString(durationString)} ({duration})
              </h2>
            </React.Fragment>
          )
      }
      <form>
        <ul style={{listStyleType: "none", padding: "0"}}>
          <li>
            <ReduxForm.Field component="input" type="text" name="targetTimeString" />
          </li>
          <li>
            <button onClick={handleSubmit(onSubmit)}>Create New Timer</button>
          </li>
          <li>
            <ReactRouterDOM.Link to="/">Reset</ReactRouterDOM.Link>
          </li>
        </ul>
      </form>
    </div>
  );
};

// setInterval の wrapper
const generateTicker = (handler: () => void, interval: number) => {
  return {
    timerId: void(0) as number | undefined,
    counter: 0,
    start () {
      if (this.counter === 0) {
        handler();
        this.timerId = setInterval(handler, interval) as any;
      }
      ++this.counter;
    },
    stop () {
      --this.counter;
      if (this.counter === 0) {
        clearInterval(this.timerId);
        this.timerId = void 0;
      }
    }
  };
};
// 0.5s 毎に changeNowTimestamp Action を発行するタイマー
const ticker = generateTicker(() => { store.dispatch(changeNowTimestamp(moment().unix())) }, 500);

// URL が変更された場合の挙動
const onRoute = Reselect.createSelector(
  [
    (props: Props) => props.onChangeTargetTimeString,
    (props: Props) => props.match.params.targetTimeString
  ],
  (onChangeTargetTimeString, targetTimeString) => {
    onChangeTargetTimeString(decodeURIComponentIfNotNull(targetTimeString));
  }
);

// Container
const TimerContainer = Redux.compose<() => JSX.Element>(
  ReactRedux.connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  ReduxForm.reduxForm({ form: "timerContainer" }),
  ReactRouterDOM.withRouter,
  Recompose.lifecycle<Props, State>({
    componentWillMount() {
      onRoute(this.props);
      ticker.start();
    },
    componentWillUnmount() {
      ticker.stop();
    },
    componentWillReceiveProps(props: Props) {
      onRoute(props);
    }
  }),
)(TimerComponent);

const App = () => (
  <ReactRedux.Provider store={store}>
    <ConnectedReactRouter.ConnectedRouter history={browserHistory}>
      <React.Fragment>
        <ReactRouter.Switch>
          <ReactRouter.Route path="/" exact={true} component={TimerContainer} />
          <ReactRouter.Route path="/:targetTimeString" component={TimerContainer} />
          <ReactRouter.Route>
            <p>not found.</p>
          </ReactRouter.Route>
        </ReactRouter.Switch>
      </React.Fragment>
    </ConnectedReactRouter.ConnectedRouter>
  </ReactRedux.Provider>
);

ReactDOM.render(<App />, document.getElementById("app") as HTMLElement);
