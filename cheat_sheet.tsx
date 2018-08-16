import * as React from "react";
import * as ReactDOM from "react-dom";
import * as Redux from "redux";
import * as ReactRedux from "react-redux";
import * as ReduxForm from "redux-form";
import * as ReactRouter from "react-router";
import * as ReactRouterDOM from "react-router-dom";
import * as ConnectedReactRouter from "connected-react-router";
import * as FSA from "typescript-fsa";
import * as FSAReducers from "typescript-fsa-reducers";
import * as Recompose from "recompose";
import * as Reselect from "reselect";
import * as history from "history";
import moment from "moment";

interface State {
  timer: TimerState;
  form: ReduxForm.FormStateMap;
  router: ConnectedReactRouter.RouterState;
}

interface TimerState {
  nowTimestamp: number;
  inputFormat?: string;
  outputFormat?: string;
}
const initialTimerState: TimerState = {
  nowTimestamp: moment().unix()
};

const actionCreator = FSA.actionCreatorFactory();
const tick = actionCreator<number>("timer/TICK");
const changeInputFormat = actionCreator<string | undefined>("timer/CHANGE_INPUT_FORMAT");
const changeOutputFormat = actionCreator<string | undefined>("timer/CHANGE_OUTPUT_FORMAT");
const timerReducer = FSAReducers.reducerWithInitialState(initialTimerState)
  .case(tick, (timerState, payload) => ({ ...timerState, nowTimestamp: payload }))
  .case(changeInputFormat, (timerState, payload) => ({ ...timerState, inputFormat: payload }))
  .case(changeOutputFormat, (timerState, payload) => ({ ...timerState, outputFormat: payload }))
  .build();

const browserHistory = history.createBrowserHistory();

const reducer = Redux.combineReducers({
  timer: timerReducer,
  form: ReduxForm.reducer
});

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || Redux.compose;

const store = Redux.createStore(
  ConnectedReactRouter.connectRouter(browserHistory)(reducer),
  composeEnhancers(Redux.applyMiddleware(ConnectedReactRouter.routerMiddleware(browserHistory)))
);

interface TimerFormData {
  title?: string;
  input?: string;
  inputFormat?: string;
}

interface TimerFormOwnProps extends ReduxForm.InjectedFormProps<TimerFormData, {}> {}

interface TimerFormStateProps {}

interface TimerFormDispatchProps {
  onSubmit(formData: TimerFormData): void;
}

type TimerFormProps = TimerFormOwnProps & TimerFormStateProps & TimerFormDispatchProps;

const timerFormMapStateToProps = (state: State): TimerFormStateProps => ({
  initialValues: { inputFormat: state.timer.inputFormat }
});

const timerFormMapDispatchToProps = (dispatch: Redux.Dispatch): TimerFormDispatchProps => ({
  onSubmit({ title, input, inputFormat }: TimerFormData) {
    dispatch(changeInputFormat(inputFormat));
    const timestamp =
      inputFormat == null || inputFormat === "" ? moment(input).unix() : moment(input, inputFormat).unix();
    if (isNaN(timestamp)) {
      return;
    }
    if (title != null && title !== "") {
      const encodedTitle = encodeURIComponent(title);
      dispatch(ConnectedReactRouter.push("/" + timestamp + "/" + encodedTitle));
    } else {
      dispatch(ConnectedReactRouter.push("/" + timestamp));
    }
  }
});

const RawTimerFormContainer = (props: TimerFormProps) => {
  const { handleSubmit, onSubmit } = props;
  return (
    <React.Fragment>
      <h2>Create New Timer</h2>
      <form>
        <ul>
          <li>
            Title: <ReduxForm.Field component="input" type="text" name="title" />
          </li>
          <li>
            Time: <ReduxForm.Field component="input" type="text" name="input" />
          </li>
          <li>
            Format: <ReduxForm.Field component="input" type="text" name="inputFormat" />
          </li>
          <li>
            <button onClick={handleSubmit(onSubmit)}>Create Timer</button>
          </li>
        </ul>
      </form>
    </React.Fragment>
  );
};
const TimerFormContainer = Redux.compose<React.SFC>(
  ReactRedux.connect(
    timerFormMapStateToProps,
    timerFormMapDispatchToProps
  ),
  ReduxForm.reduxForm({ form: "timerContainer" })
)(RawTimerFormContainer);

interface PathParams {
  timerTitle?: string;
  timestamp?: string;
}

interface TimerOwnProps
  extends ReduxForm.InjectedFormProps<TimerFormData, {}>,
    ReactRouter.RouteComponentProps<PathParams> {}

interface TimerStateProps {
  timerTitle?: string;
  timestampString: string;
  duration: number;
  durationString: string;
}

interface TimerDispatchProps {}

type TimerProps = TimerOwnProps & TimerStateProps & TimerDispatchProps;

const timerMapStateToProps = (state: State, ownProps: TimerOwnProps): TimerStateProps => {
  const {
    timer: { outputFormat, nowTimestamp }
  } = state;
  const {
    match: {
      params: { timerTitle, timestamp: timestampString }
    }
  } = ownProps;
  const timestamp = parseInt(timestampString!);
  const time = moment.unix(timestamp);
  const nowTime = moment.unix(nowTimestamp);
  return {
    timerTitle,
    timestampString: time.toISOString(true),
    duration: Math.abs(nowTime.diff(time)),
    durationString: time.from(nowTime)
  };
};

const timerMapDispatchToProps = (dispatch: Redux.Dispatch): TimerDispatchProps => ({});

const generateTicker = () => {
  let timerId: number | undefined;
  let counter = 0;
  const startTicker = () => {
    if (counter === 0) {
      store.dispatch(tick(moment().unix()));
      timerId = setInterval(() => {
        store.dispatch(tick(moment().unix()));
      }, 500) as any;
    }
    ++counter;
  };
  const stopTicker = () => {
    --counter;
    if (counter === 0) {
      clearInterval(timerId);
      timerId = void 0;
    }
  };
  return { startTicker, stopTicker };
};
const { startTicker, stopTicker } = generateTicker();

const RawTimerContainer = (props: TimerProps) => {
  const { timerTitle, timestampString, duration, durationString } = props;
  return (
    <React.Fragment>
      <h2>
        {timestampString}{timerTitle == null ? "" : ": " + timerTitle}
      </h2>
      <h3>
        {durationString} ({((duration / 60 / 60) | 0) / 1000} hours)
      </h3>
      <p>
        <ReactRouterDOM.Link to="/">Create New Timer</ReactRouterDOM.Link>
      </p>
    </React.Fragment>
  );
};
const TimerContainer = Redux.compose<React.SFC>(
  Recompose.lifecycle({
    componentWillMount() {
      startTicker();
    },
    componentWillUnmount() {
      stopTicker();
    }
  }),
  ReactRedux.connect(
    timerMapStateToProps,
    timerMapDispatchToProps
  ),
  ReactRouterDOM.withRouter,
)(RawTimerContainer);

const App = () => (
  <ReactRedux.Provider store={store}>
    <ConnectedReactRouter.ConnectedRouter history={browserHistory}>
      <React.Fragment>
        <h1>URL Timer</h1>
        <ReactRouter.Switch>
          <ReactRouter.Route path="/" exact={true} component={TimerFormContainer} />
          <ReactRouter.Route path="/:timestamp/:timerTitle" component={TimerContainer} />
          <ReactRouter.Route path="/:timestamp" component={TimerContainer} />
          <ReactRouter.Route>
            <p>not found.</p>
          </ReactRouter.Route>
        </ReactRouter.Switch>
      </React.Fragment>
    </ConnectedReactRouter.ConnectedRouter>
  </ReactRedux.Provider>
);

ReactDOM.render(<App />, document.getElementById("app") as HTMLElement);
