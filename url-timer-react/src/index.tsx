// ## import

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as Redux from 'redux'
import * as ReactRedux from 'react-redux'
import * as ReactRouter from 'react-router'
import * as ReactRouterDOM from 'react-router-dom'
import * as ConnectedReactRouter from 'connected-react-router'
import * as TypeScriptFSA from 'typescript-fsa'
import * as TypeScriptFSAReducers from 'typescript-fsa-reducers'
import * as Recompose from 'recompose'
import * as Formik from 'formik'
import * as History from 'history'
import * as luxon from 'luxon'

// ## Utilities

const baseURLPath = '/url-timer/'

const convertStringToTimestamp = (s: string) =>
  s.match(/^\d+$/) != null ? +s * 1000 : luxon.DateTime.fromISO(s).toMillis()
const convertTimestampToString = (ts: number) => luxon.DateTime.fromMillis(ts).toISO()
const convertDurationToString = (d: number) =>
  luxon.Duration.fromMillis(Math.abs(d))
    .shiftTo('years', 'months', 'days', 'minutes', 'hours', 'seconds')
    .toISO()
const getNow = () => Math.floor(Date.now() / 1000) * 1000

// ## States

// ### TimerState

type TimerState = {
  nowTimestamp: number
  notificationEnabled?: boolean
  notificationPermission?: NotificationPermission
}
const initialTimerState: TimerState = {
  nowTimestamp: getNow()
}

// ### Root State

type State = {
  timer: TimerState
  router: ConnectedReactRouter.RouterState
}

// ## Modules

// ### Actions

const actionCreator = TypeScriptFSA.actionCreatorFactory('timer')
const setNowTimestamp = actionCreator<number>('SET_NOW_TIMESTAMP')
const setNotificationEnabled = actionCreator<boolean>('SET_NOTIFICATION_ENABLED')
const requestNotificationPermission = actionCreator.async<undefined, NotificationPermission>(
  'REQUEST_NOTIFICATION_PERMISSION'
)

// ### Reducers

const timerReducer = TypeScriptFSAReducers.reducerWithInitialState(initialTimerState)
  .case(setNowTimestamp, (state, payload) => ({ ...state, nowTimestamp: payload }))
  .case(setNotificationEnabled, (state, payload) => ({ ...state, notificationEnabled: payload }))
  .case(requestNotificationPermission.done, (state, payload) => ({
    ...state,
    notificationPermission: payload.result
  }))
  .build()

const doRequestNotificationPermission = async (dispatch: Redux.Dispatch) => {
  const perm = await Notification.requestPermission()
  dispatch(requestNotificationPermission.done({ result: perm }))
}

const createRootReducer = (history: History.History) =>
  Redux.combineReducers({
    router: ConnectedReactRouter.connectRouter(history),
    timer: timerReducer
  })

// ## Store

const browserHistory = History.createBrowserHistory({ basename: baseURLPath })

// Redux Devtools
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: typeof Redux.compose
  }
}

const composeEnhancers =
  (process.env.NODE_ENV === 'development' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || Redux.compose

const store = Redux.createStore(
  createRootReducer(browserHistory),
  composeEnhancers(Redux.applyMiddleware(ConnectedReactRouter.routerMiddleware(browserHistory)))
)

// ## Components

// ### TimerForm

interface TimerFormProps {}

const TimerFormComponent = ({  }: TimerFormProps) => (
  <Formik.Form>
    <ul style={{ listStyleType: 'none' }}>
      <li>
        <Formik.Field type="text" name="targetTimeString" style={{ width: 300 }} />
      </li>
      <li>
        <button type="submit" style={{ width: 300 }}>
          Create Timer
        </button>
      </li>
    </ul>
  </Formik.Form>
)

type TimerFormData = {
  targetTimeString: string // form から取得するパラメータ (formik)
}
type TimerFormDispatchProps = {
  dispatch: Redux.Dispatch
}
type TimerFormMergedProps = TimerFormDispatchProps
type TimerFormInjectedFormikProps = Formik.InjectedFormikProps<TimerFormMergedProps, TimerFormData>
type TimerFormAllProps = TimerFormMergedProps & TimerFormInjectedFormikProps

const TimerFormContainer = Recompose.compose<TimerFormAllProps, {}>(
  ReactRedux.connect<{}, TimerFormDispatchProps, {}, State>(
    _state => ({}),
    dispatch => ({ dispatch })
  ),
  Formik.withFormik<TimerFormMergedProps, TimerFormData>({
    mapPropsToValues: _props => ({ targetTimeString: convertTimestampToString(getNow()) }),
    handleSubmit: (formData, { props: { dispatch } }) => {
      const unixTime = Math.floor(convertStringToTimestamp(formData.targetTimeString) / 1000)
      if (!isNaN(unixTime)) {
        dispatch(ConnectedReactRouter.push(`/${unixTime}`))
      }
    }
  })
)(TimerFormComponent)

// ### TimerView

// #### Component

interface TimerViewProps {
  duration: number
  targetTimeString: string
}

const TimerViewComponent = ({ duration, targetTimeString }: TimerViewProps) => (
  <div style={{ textAlign: 'center' }}>
    <h1>
      {convertDurationToString(duration)}
      <span style={{ fontSize: '80%' }}>{duration >= 0 ? ' (left)' : ' (ago)'}</span>
    </h1>
    <h2>{targetTimeString}</h2>
    <div style={{ marginTop: 5 }}>
      <ReactRouterDOM.Link to="/">Reset</ReactRouterDOM.Link>
    </div>
  </div>
)

// #### Container

// ##### Types

type TimerViewPathParams = {
  targetTimeString: string // URL (Path) から取得するパラメータ (react-router)
}
type TimerViewInjectedRouterProps = ReactRouter.RouteComponentProps<TimerViewPathParams>
type TimerViewOwnProps = TimerViewInjectedRouterProps
type TimerViewStateProps = {
  nowTimestamp: number
  notificationEnabled?: boolean
  notificationPermission?: NotificationPermission
}
type TimerViewDispatchProps = {
  dispatch: Redux.Dispatch
}
type TimerViewComputedProps = {
  targetTimestamp: number
  targetTimeString: string
  duration: number
  onTick(): void
}
type TimerViewMergedProps = TimerViewOwnProps & TimerViewStateProps & TimerViewDispatchProps & TimerViewComputedProps
type TimerViewInjectedStateProps = Recompose.stateProps<number | undefined, 'timerId', 'setTimerId'>
type TimerViewAllProps = TimerViewMergedProps & TimerViewInjectedStateProps

// ##### Properties

const TimerViewContainer = Recompose.compose<TimerViewProps, {}>(
  ReactRouterDOM.withRouter,
  ReactRedux.connect<TimerViewStateProps, TimerViewDispatchProps, TimerViewOwnProps, TimerViewMergedProps, State>(
    ({ timer: { nowTimestamp, notificationEnabled, notificationPermission } }) => ({
      nowTimestamp,
      notificationEnabled,
      notificationPermission
    }),
    dispatch => ({ dispatch }),
    (stateProps, { dispatch }, ownProps) => {
      const { nowTimestamp, notificationEnabled, notificationPermission } = stateProps
      const targetTimestamp = convertStringToTimestamp(ownProps.match.params.targetTimeString)
      const targetTimeString = convertTimestampToString(targetTimestamp)
      const duration = targetTimestamp - nowTimestamp
      return {
        ...stateProps,
        dispatch,
        ...ownProps,
        targetTimestamp,
        targetTimeString,
        duration,
        onTick() {
          const now = getNow()
          if (notificationEnabled && now >= targetTimestamp) {
            if (notificationPermission === 'granted') {
              const _notif = new Notification(targetTimeString)
            }
            dispatch(setNotificationEnabled(false))
          }
          dispatch(setNowTimestamp(now))
        }
      }
    }
  ),
  // ##### State / Lifecycle
  Recompose.withState('timerId', 'setTimerId', void 0),
  Recompose.lifecycle<TimerViewAllProps, {}>({
    componentDidMount() {
      const { onTick, setTimerId, dispatch, targetTimestamp } = this.props
      setTimerId(window.setInterval(onTick, 500))
      onTick()
      dispatch(setNotificationEnabled(targetTimestamp > getNow()))
      doRequestNotificationPermission(dispatch)
    },
    componentWillUnmount() {
      clearInterval(this.props.timerId)
    }
  })
)(TimerViewComponent)

// ## Router

const App = () => (
  <ReactRedux.Provider store={store}>
    <ConnectedReactRouter.ConnectedRouter history={browserHistory}>
      <ReactRouter.Switch>
        <ReactRouter.Route path="/" exact={true} component={TimerFormContainer} />
        <ReactRouter.Route path="/:targetTimeString" component={TimerViewContainer} />
      </ReactRouter.Switch>
    </ConnectedReactRouter.ConnectedRouter>
  </ReactRedux.Provider>
)

ReactDOM.render(<App />, document.getElementById('app') as HTMLElement)
