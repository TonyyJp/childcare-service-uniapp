import { ref, computed } from 'vue'
import {
  fetchCourses,
  fetchCurrentMenu,
  fetchHome,
  fetchMealsToday,
  fetchProfile,
  fetchStudents,
  fetchUnreadCount,
  reportSubscribe,
} from '../../api/parent.js'
import { mediaUrl } from '../../config.js'
import { ensureWechatRuntime, getMpDisplayName, getSubscribeTemplates } from '../../utils/wechatRuntime.js'

export const PARENT_CTX_KEY = 'parentCtx'
export const ACCENT = '#3B9EEB'

const METHOD_LABEL = { manual: '名单签到', photo: '拍照签到', face: '刷脸签到' }
const MEAL_META = {
  breakfast: { name: '早餐', icon: 'sunrise' },
  lunch: { name: '午餐', icon: 'utensils' },
  dinner: { name: '晚餐', icon: 'moon' },
  snack: { name: '加餐', icon: 'apple' },
}

export function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone || '—'
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

export function formatDateLabel(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.replace(/-/g, '/'))
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${week}`
}

export function shiftDate(dateStr, days) {
  const d = new Date((dateStr || new Date().toISOString().slice(0, 10)).replace(/-/g, '/'))
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 孩子默认头像（人像）：男 user / 女 user-round / 保密·未知 circle-user-round */
export function childAvatarIcon(gender) {
  if (gender === 'male') return 'user'
  if (gender === 'female') return 'user-round'
  return 'circle-user-round'
}

export function childAvatarColor(gender) {
  if (gender === 'male') return '#42A5F5'
  if (gender === 'female') return '#EC407A'
  return '#8D6E63'
}

/** Shared parent shell state: child selection + profile header fields. */
export function createParentContext() {
  const accentColor = ref(ACCENT)
  const activeTab = ref('home')
  const showProfile = ref(false)
  const profilePage = ref('main')
  const selectedCourse = ref(null)
  const menuVisible = ref(false)

  const homeLoading = ref(false)
  const parentName = ref('家长')
  const parentPhone = ref('')
  const parentAvatarUrl = ref('')
  const parentAvatar = computed(() => (parentName.value || '家').slice(0, 1))
  const parentPhoneMasked = computed(() => maskPhone(parentPhone.value))
  const homeDate = ref('')
  const homeDateLabel = computed(() => formatDateLabel(homeDate.value) || '')
  const brandName = ref(getMpDisplayName())
  /** 机构名册（无孩子也可归属机构） */
  const membershipTenants = ref([])
  const membershipTenantName = computed(() => {
    const first = membershipTenants.value[0]
    return (first?.name || '').trim()
  })
  const membershipTenantId = computed(() => membershipTenants.value[0]?.id || null)
  /** 已加入机构 → 机构名；否则 → 后台配置的小程序显示名 */
  const homeTitle = computed(() => {
    const fromChild = (activeChild.value?.tenant || '').trim()
    if (fromChild && fromChild !== '—') return fromChild
    if (membershipTenantName.value) return membershipTenantName.value
    return brandName.value
  })
  const childOptions = ref([])
  const activeChildId = ref(null)
    const activeChild = ref({
    name: '—',
    gender: 'unknown',
    emoji: childAvatarIcon('unknown'),
    avatarColor: childAvatarColor('unknown'),
    avatarUrl: '',
    class: '—',
    tenant: '—',
    checkinLabel: '暂无签到',
    inGarden: false,
    needsBind: false,
  })
  const todayItems = ref([])
  const yesterdayItems = ref([])
  const homeworkEntryHint = ref('查看已发布作业')
  const courses = ref([])

  function buildAttendanceItems(list, prefix) {
    const items = []
    ;(list || []).forEach((row, idx) => {
      const period = row.period_name || '托管'
      const method = METHOD_LABEL[row.arrive_method] || row.arrive_method || '签到'
      if (row.arrive_time || ['arrived', 'left'].includes(row.status)) {
        items.push({
          id: `${prefix}-in-${idx}`,
          type: 'checkin',
          time: row.arrive_time || '--:--',
          title: `${period}到园`,
          checkinMethod: `${method}${row.is_late ? ' · 迟到' : ''}`,
        })
      } else if (row.status === 'waiting') {
        items.push({
          id: `${prefix}-wait-${idx}`,
          type: 'checkin',
          time: '--:--',
          title: `${period}待签到`,
          checkinMethod: '未到',
        })
      } else if (row.status === 'leave') {
        items.push({
          id: `${prefix}-leave-${idx}`,
          type: 'notice',
          time: '--:--',
          noticeSender: period,
          noticeTitle: '请假',
          noticeBody: `${period}请假中`,
        })
      } else if (row.status === 'absent') {
        items.push({
          id: `${prefix}-absent-${idx}`,
          type: 'notice',
          time: '--:--',
          noticeSender: period,
          noticeTitle: '缺勤',
          noticeBody: `${period}标记为缺勤`,
        })
      }
      if (row.leave_time || row.status === 'left') {
        items.push({
          id: `${prefix}-out-${idx}`,
          type: 'checkout',
          time: row.leave_time || '--:--',
          title: `${period}离园`,
          checkinMethod: row.pickup_person?.name ? `${row.pickup_person.name}接离` : '已离园',
        })
      }
    })
    return items
  }

  function buildHomeTimeline(home, mealDetails = [], menuList = []) {
    const items = buildAttendanceItems(home?.attendance_today, home?.date === homeDate.value ? 't' : 'y')
    const hw = home?.latest_homework
    if (hw) {
      items.push({
        id: `hw-${hw.id}`,
        type: 'homework',
        time: '作业',
        subject: hw.subject || '作业',
        subjectColor: '#3B9EEB',
        hwTitle: hw.title || '最新作业',
        hwComment: hw.my_status === 'graded'
          ? '已批改，可前往作业查看详情'
          : (hw.my_status === 'pending' ? '待提交' : `状态：${hw.my_status || '已发布'}`),
      })
      homeworkEntryHint.value = hw.title ? `最新：${hw.title}` : '查看已发布作业'
    } else if (home?.date === homeDate.value || !homeDate.value) {
      homeworkEntryHint.value = '暂无新作业'
    }
    ;(home?.meals_today || []).forEach((m, idx) => {
      const meta = MEAL_META[m.meal_type] || { name: m.meal_type || '餐食', icon: 'soup' }
      const detail = mealDetails.find(d => d.meal_type === m.meal_type)
      const photos = (detail?.photos || []).map(mediaUrl).filter(Boolean)
      items.push({
        id: `meal-${home?.date || 'd'}-${idx}`,
        type: 'meal',
        time: '餐食',
        mealName: meta.name,
        mealIcon: meta.icon,
        mealItems: photos.length
          ? `已上传 ${photos.length} 张照片`
          : (m.photo_count ? `已上传 ${m.photo_count} 张照片` : '已记录'),
        mealContent: m.content || '',
        photos,
      })
    })
    if (home?.menu_published) {
      const MEAL_LABEL = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
      const body = menuList.length
        ? menuList.map(m => `${MEAL_LABEL[m.meal_type] || m.meal_type}：${Array.isArray(m.dishes) ? m.dishes.join('、') : (m.dishes || '')}`).filter(Boolean).join('；')
        : '本周食谱已发布'
      items.push({
        id: 'menu',
        type: 'notice',
        time: '食谱',
        noticeSender: '营养餐',
        noticeTitle: '本周食谱',
        noticeBody: body || '本周食谱已发布',
      })
    }
    return items
  }

  function applyChildHeader(binding, home) {
    const student = binding?.student || home?.student || {}
    const attendance = home?.attendance_today || []
    const arrived = attendance.find(a => a.arrive_time || ['arrived', 'left'].includes(a.status))
    const className = binding?.class?.name || binding?.clazz?.name || student.class_name || '—'
    const tenantName = binding?.tenant?.name || '—'
    const gender = student.gender || 'unknown'
    activeChild.value = {
      name: student.name || '宝贝',
      gender,
      emoji: childAvatarIcon(gender),
      avatarColor: childAvatarColor(gender),
      avatarUrl: mediaUrl(student.avatar || ''),
      class: className,
      tenant: tenantName,
      checkinLabel: arrived?.arrive_time ? `✓ ${arrived.arrive_time} 已签到` : '今日暂无签到',
      inGarden: !!(arrived && arrived.status === 'arrived'),
      needsBind: false,
    }
  }

  async function loadMarketingCourses() {
    const studentId = activeChildId.value
    const tenantId = membershipTenantId.value
    if (!studentId && !tenantId) {
      courses.value = []
      return
    }
    try {
      const data = await fetchCourses(studentId || undefined, studentId ? undefined : tenantId)
      courses.value = (data?.list || []).map(c => ({
        ...c,
      }))
    } catch {
      courses.value = []
    }
  }

  async function refreshTimeline() {
    const binding = childOptions.value.find(c => c.id === activeChildId.value)?.binding
    if (!activeChildId.value) return

    const home = await fetchHome(activeChildId.value)
    homeDate.value = home?.date || ''
    applyChildHeader(binding, home)

    let mealDetails = []
    let menuList = []
    try {
      const meals = await fetchMealsToday(activeChildId.value, home?.date)
      mealDetails = meals?.list || []
    } catch {
      mealDetails = []
    }
    try {
      const menu = await fetchCurrentMenu()
      menuList = menu?.list || []
    } catch {
      menuList = []
    }
    todayItems.value = buildHomeTimeline(home, mealDetails, menuList)
    await loadMarketingCourses()

    try {
      const yDate = shiftDate(home?.date, -1)
      const yHome = await fetchHome(activeChildId.value, yDate)
      let yMeals = []
      try {
        const ym = await fetchMealsToday(activeChildId.value, yDate)
        yMeals = ym?.list || []
      } catch {
        yMeals = []
      }
      yesterdayItems.value = buildHomeTimeline(yHome, yMeals, [])
    } catch {
      yesterdayItems.value = []
    }
  }

  function applyGuardianProfile(profile) {
    parentName.value = profile?.nickname || profile?.name || '家长'
    parentPhone.value = profile?.phone || ''
    parentAvatarUrl.value = mediaUrl(profile?.avatar || '')
  }

  async function loadParentHome() {
    homeLoading.value = true
    try {
      try {
        await ensureWechatRuntime(false)
        brandName.value = getMpDisplayName()
      } catch (_) {
        brandName.value = getMpDisplayName()
      }

      const [profile, studentsRes] = await Promise.all([fetchProfile(), fetchStudents()])
      applyGuardianProfile(profile)
      membershipTenants.value = (profile?.tenants || [])
        .filter(t => t?.id && t?.name)
        .map(t => ({ id: t.id, name: String(t.name).trim() }))

      const list = (studentsRes?.list || []).filter(i => i.binding_status === 'approved' && i.student?.id)
      childOptions.value = list.map(i => {
        const gender = i.student.gender || 'unknown'
        return {
          id: i.student.id,
          name: i.student.name,
          gender,
          emoji: childAvatarIcon(gender),
          avatarColor: childAvatarColor(gender),
          avatarUrl: mediaUrl(i.student.avatar || ''),
          tenant: i.tenant?.name || '—',
          binding: i,
        }
      })

      if (!childOptions.value.length) {
        activeChildId.value = null
        todayItems.value = []
        yesterdayItems.value = []
        activeChild.value = {
          name: '未绑定宝贝',
          gender: 'unknown',
          emoji: childAvatarIcon('unknown'),
          avatarColor: childAvatarColor('unknown'),
          avatarUrl: '',
          class: '—',
          tenant: membershipTenantName.value || '—',
          checkinLabel: '去绑定',
          inGarden: false,
          needsBind: true,
        }
        await loadMarketingCourses()
        return
      }

      if (!activeChildId.value || !childOptions.value.some(c => c.id === activeChildId.value)) {
        activeChildId.value = childOptions.value[0].id
      }

      await refreshTimeline()
    } catch (e) {
      uni.showToast({ title: e.message || '首页加载失败', icon: 'none' })
    } finally {
      homeLoading.value = false
    }
  }

  async function selectChild(id) {
    if (activeChildId.value === id) return
    activeChildId.value = id
    homeLoading.value = true
    try {
      await refreshTimeline()
    } catch (e) {
      uni.showToast({ title: e.message || '切换失败', icon: 'none' })
    } finally {
      homeLoading.value = false
    }
  }

  const unreadCount = ref(0)
  const unreadByType = ref({})
  const feedDailyUnread = computed(() => Number(unreadByType.value.daily || 0))
  const feedCommentUnread = computed(() => Number(unreadByType.value.daily_comment || 0))

  async function refreshUnreadCount() {
    try {
      const data = await fetchUnreadCount()
      unreadCount.value = data?.total || 0
      unreadByType.value = data?.by_type || {}
    } catch {
      // ignore
    }
  }

  function openProfile() {
    profilePage.value = 'main'
    activeTab.value = 'me'
    showProfile.value = false
  }

  function closeProfile() {
    if (profilePage.value !== 'main') {
      profilePage.value = 'main'
      return
    }
    showProfile.value = false
    // 「我的」已是底栏 Tab：主页不再因返回切走
  }

  function goProfilePage(page) {
    profilePage.value = page
    if (activeTab.value !== 'me') {
      activeTab.value = 'me'
    }
    showProfile.value = false
  }

  function openFeature(nav) {
    if (!nav) return
    if (nav.tab) {
      activeTab.value = nav.tab
      if (nav.tab === 'me' && nav.page) profilePage.value = nav.page
      return
    }
    if (nav.page) goProfilePage(nav.page)
    if (nav.menu) menuVisible.value = true
  }

  /** 首页「去绑定」→ 我的宝贝 + 打开添加宝贝表单 */
  const pendingOpenBindingCompose = ref(false)
  function goBindChild() {
    pendingOpenBindingCompose.value = true
    profilePage.value = 'child'
    activeTab.value = 'me'
    showProfile.value = false
  }

  function consumeOpenBindingCompose() {
    if (!pendingOpenBindingCompose.value) return false
    pendingOpenBindingCompose.value = false
    return true
  }

  const NOTIFY_PREF_KEY = 'parent_notify_prefs'
  const defaultNotifyPrefs = () => ([
    { key: 'homework', label: '作业提醒', desc: '布置、批改与截止提醒', on: false, busy: false },
    { key: 'attendance', label: '考勤提醒', desc: '到园、离园与请假结果', on: false, busy: false },
    { key: 'notice', label: '园所通知', desc: '机构通知与活动安排', on: false, busy: false },
    { key: 'daily', label: '日常动态', desc: '班级日常发布提醒', on: false, busy: false },
  ])
  function loadNotifyPrefs() {
    try {
      const raw = uni.getStorageSync(NOTIFY_PREF_KEY)
      if (raw) {
        const saved = typeof raw === 'string' ? JSON.parse(raw) : raw
        const base = defaultNotifyPrefs()
        return base.map(b => ({ ...b, on: saved[b.key] === true, busy: false }))
      }
    } catch (_) {}
    return defaultNotifyPrefs()
  }
  const notifyPrefs = ref(loadNotifyPrefs())
  const notifyPrefsOnLabel = computed(() => {
    const on = notifyPrefs.value.filter(n => n.on).length
    return on === notifyPrefs.value.length ? '已开启全部类型' : `已开启 ${on}/${notifyPrefs.value.length} 类`
  })
  function persistNotifyPrefs() {
    const map = {}
    notifyPrefs.value.forEach(n => { map[n.key] = !!n.on })
    uni.setStorageSync(NOTIFY_PREF_KEY, map)
  }

  /** 开启某类通知：拉起微信订阅弹窗，仅「允许」时上报 remain_count */
  async function requestNotifySubscribe(key) {
    await ensureWechatRuntime(false)
    const tplId = (getSubscribeTemplates()[key] || '').trim()
    if (!tplId) {
      uni.showToast({ title: '尚未配置该类模板消息', icon: 'none' })
      return false
    }
    if (typeof uni.requestSubscribeMessage !== 'function') {
      uni.showToast({ title: '当前环境不支持订阅消息', icon: 'none' })
      return false
    }
    return new Promise((resolve) => {
      uni.requestSubscribeMessage({
        tmplIds: [tplId],
        success: async (res) => {
          const status = res?.[tplId]
          if (status === 'accept') {
            try {
              await reportSubscribe(`parent_${key}`, 1)
              uni.showToast({ title: '已开启微信通知', icon: 'success' })
              resolve(true)
            } catch (e) {
              uni.showToast({ title: e.message || '上报失败', icon: 'none' })
              resolve(false)
            }
            return
          }
          if (status === 'reject') {
            uni.showToast({ title: '你已拒绝该类通知', icon: 'none' })
          } else if (status === 'ban') {
            uni.showToast({ title: '该类通知已被禁用，请在设置中开启', icon: 'none' })
          } else {
            uni.showToast({ title: '未完成订阅授权', icon: 'none' })
          }
          resolve(false)
        },
        fail: (err) => {
          const msg = err?.errMsg || ''
          if (/cancel|取消/i.test(msg)) {
            uni.showToast({ title: '已取消', icon: 'none' })
          } else {
            uni.showToast({ title: msg || '订阅失败', icon: 'none' })
          }
          resolve(false)
        },
      })
    })
  }

  async function toggleNotifyPref(key) {
    const row = notifyPrefs.value.find(n => n.key === key)
    if (!row || row.busy) return
    if (row.on) {
      row.on = false
      persistNotifyPrefs()
      uni.showToast({ title: '已关闭本机偏好', icon: 'none' })
      return
    }
    row.busy = true
    try {
      const ok = await requestNotifySubscribe(key)
      if (ok) {
        row.on = true
        persistNotifyPrefs()
      }
    } finally {
      row.busy = false
    }
  }
  function clearLocalCache() {
    uni.showModal({
      title: '清除本地缓存',
      content: '将清除本机通知偏好设置，是否继续？',
      success: (res) => {
        if (!res.confirm) return
        try { uni.removeStorageSync(NOTIFY_PREF_KEY) } catch (_) {}
        notifyPrefs.value = defaultNotifyPrefs()
        uni.showToast({ title: '已清除', icon: 'success' })
      },
    })
  }

  return {
    accentColor,
    activeTab,
    showProfile,
    profilePage,
    selectedCourse,
    menuVisible,
    unreadCount,
    unreadByType,
    feedDailyUnread,
    feedCommentUnread,
    refreshUnreadCount,
    openFeature,
    homeLoading,
    parentName,
    parentPhone,
    parentAvatar,
    parentAvatarUrl,
    parentPhoneMasked,
    homeDate,
    homeDateLabel,
    homeTitle,
    brandName,
    membershipTenants,
    membershipTenantId,
    membershipTenantName,
    childOptions,
    activeChildId,
    activeChild,
    todayItems,
    yesterdayItems,
    homeworkEntryHint,
    courses,
    loadMarketingCourses,
    notifyPrefs,
    notifyPrefsOnLabel,
    applyGuardianProfile,
    loadParentHome,
    refreshTimeline,
    selectChild,
    openProfile,
    closeProfile,
    goProfilePage,
    goBindChild,
    consumeOpenBindingCompose,
    toggleNotifyPref,
    clearLocalCache,
  }
}
