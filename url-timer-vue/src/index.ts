// ## import

import Vue from 'vue'
import VueRouter, { Route } from 'vue-router'
import * as Vuex from 'vuex'
import * as VuexRouterSync from 'vuex-router-sync'
import * as luxon from 'luxon'

Vue.use(VueRouter)
Vue.use(Vuex)

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
  notificationPermisson?: NotificationPermission
}
const initialTimerState: TimerState = {
  nowTimestamp: getNow()
}

// ### Root State

type State = {
  timer: TimerState
  route: Route
}

// ## Modules

const setNowTimestamp = 'SET_NOW_TIMESTAMP'
const setNotificationEnabled = 'SET_NOTIFICATION_ENABLED'
const setNotificationPermission = 'SET_NOTIFICATION_PERMISSION'
const requestNotificationPermission = 'REQUEST_NOTIFICATION_PERMISSION'

const timerModule: Vuex.Module<TimerState, State> = {
  state: initialTimerState,
  mutations: {
    [setNowTimestamp]: (state, payload: number) => {
      state.nowTimestamp = payload
    },
    [setNotificationEnabled]: (state, payload: boolean) => {
      state.notificationEnabled = payload
    },
    [setNotificationPermission]: (state, payload: NotificationPermission) => {
      state.notificationPermisson = payload
    }
  },
  actions: {
    [requestNotificationPermission]: async ({ commit }) => {
      const perm = await Notification.requestPermission()
      commit(setNotificationPermission, perm)
    }
  }
}

// ## Store

const store = new Vuex.Store<State>({
  modules: {
    timer: timerModule
  }
})

// ## Components

// ### TimerForm

const TimerForm = Vue.extend({
  template: `
    <form @submit.prevent="onSubmit">
      <ul style="list-style-type: none;">
        <li>
          <input type="text" v-model="targetTimeString" style="width: 300px;" />
        </li>
        <li>
          <button style="width: 300px;">Create Timer</button>
        </li>
      </ul>
    </form>
  `,
  data: () => ({
    targetTimeString: convertTimestampToString(getNow())
  }),
  methods: {
    onSubmit: function() {
      const unixTime = Math.floor(convertStringToTimestamp(this.targetTimeString) / 1000)
      if (!isNaN(unixTime)) {
        this.$router.push(`/${unixTime}`)
      }
    }
  }
})

// ### TimerView

// ##### Template

type TimerViewPathParams = {
  targetTimeString: string // URL (Path) から取得するパラメータ
}

const TimerView = Vue.extend({
  template: `
    <div style="text-align: center">
      <h1>
        {{ durationString }}
        <span style="font-size: 80%;" v-if="duration >= 0">(left)</span>
        <span style="font-size: 80%;" v-else>(ago)</span>
      </h1>
      <h2>{{ targetTimeString }}</h2>
      <div style="margin-top: 5px;">
        <router-link to="/">Reset</router-link>
      </div>
    </div>
  `,
  computed: {
    storeState: function(): State {
      return this.$store.state
    },
    routeParams() {
      return this.$route.params as TimerViewPathParams
    },
    nowTimestamp() {
      return this.storeState.timer.nowTimestamp
    },
    targetTimestamp() {
      return convertStringToTimestamp(this.routeParams.targetTimeString)
    },
    targetTimeString() {
      return convertTimestampToString(this.targetTimestamp)
    },
    duration() {
      return this.targetTimestamp - this.nowTimestamp
    },
    durationString() {
      return convertDurationToString(this.duration)
    }
  },
  watch: {
    nowTimestamp(newNowTimestamp: number) {
      const { notificationEnabled, notificationPermisson } = this.storeState.timer
      if (notificationEnabled && newNowTimestamp >= this.targetTimestamp) {
        if (notificationPermisson === 'granted') {
          const _notif = new Notification(this.targetTimeString)
        }
        this.$store.commit(setNotificationEnabled, false)
      }
    }
  },
  data: () => ({
    timerId: undefined as number | undefined
  }),
  mounted() {
    const onTick = () => this.$store.commit(setNowTimestamp, getNow())
    this.timerId = window.setInterval(onTick, 500)
    onTick()
    this.$store.commit(setNotificationEnabled, this.targetTimestamp > getNow())
    this.$store.dispatch(requestNotificationPermission)
  },
  beforeDestroy() {
    clearInterval(this.timerId)
  }
})

// ## Router

const router = new VueRouter({
  base: baseURLPath,
  mode: 'history',
  routes: [{ path: '/', component: TimerForm }, { path: '/:targetTimeString', component: TimerView }]
})

VuexRouterSync.sync(store, router)

const App = Vue.extend({
  template: `<router-view></router-view>`,
  store,
  router
})

const _vm = new Vue({
  el: '#app',
  render: h => h(App)
})
