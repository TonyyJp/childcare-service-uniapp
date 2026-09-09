import { ref, computed } from 'vue'
import {
  fetchCourses,
  fetchCurrentMenu,
  fetchHome,
  fetchMealsToday,
  fetchProfile,
  fetchStudents,
  reportSubscribe,
} from '../../api/parent.js'
import { mediaUrl, WX_SUBSCRIBE_TEMPLATES } from '../../config.js'

export const PARENT_CTX_KEY = 'parentCtx'
export const ACCENT = '#3B9EEB'

const METHOD_LABEL = { manual: '名单签到', photo: '拍照签到', face: '刷脸签到' }
const MEAL_META = {
  breakfast: { name: '早餐', emoji: '🌅' },
  lunch: { name: '午餐', emoji: '🍱' },
  dinner: { name: '晚餐', emoji: '🌙' },
  snack: { name: '加餐', emoji: '🍎' },
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

export function genderEmoji(gender) {
  return gender === 'female' ? '👧' : '🧒'
}

/** Shared parent shell state: child selection + profile header fields. */
export function createParentContext() {
  const accentColor = ref(ACCENT)
  const activeTab = ref('home')
  const showProfile = ref(false)
  const profilePage = ref('main')
  const selectedCourse = ref(null)
  const unreadCount = ref(0)

  const homeLoading = ref(false)
  const parentName = ref('家长')
  const parentPhone = ref('')
  const parentAvatar = computed(() => (parentName.value || '家').slice(0, 1))
  const parentPhoneMasked = computed(() => maskPhone(parentPhone.value))
  const homeDate = ref('')
  const homeDateLabel = computed(() => formatDateLabel(homeDate.value) || '今日动态')
  const childOptions = ref([])
  const activeChildId = ref(null)
  const activeChild = ref({
    name: '—',
    emoji: '🧒',
    class: '—',
    tenant: '—',
    checkinLabel: '暂无签到',
    inGarden: false,
  })
  const todayItems = ref([])
  const yesterdayItems = ref([])
  const homeworkEntryHint = ref('查看已发布作业')
  const courses = ref([])

  const healthArchive = computed(() => {
    const s = childOptions.value.find(c => c.id === activeChildId.value)?.binding?.student || {}
    const genderMap = { male: '男', female: '女', unknown: '未填' }
    return {
      name: s.name || activeChild.value.name || '宝贝',
      genderLabel: genderMap[s.gender] || '未填',
      birth_date: s.birth_date || '',
      school: s.school || '',
      grade_level: s.grade_level || '',
      health_note: s.health_note || '',
      emergency_contact: s.emergency_contact || '',
      emergency_phone: s.emergency_phone || '',
    }
  })

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
      const meta = MEAL_META[m.meal_type] || { name: m.meal_type || '餐食', emoji: '🍱' }
      const detail = mealDetails.find(d => d.meal_type === m.meal_type)
      const photos = (detail?.photos || []).map(mediaUrl).filter(Boolean)
      items.push({
        id: `meal-${home?.date || 'd'}-${idx}`,
        type: 'meal',
        time: '餐食',
        mealName: meta.name,
        mealEmoji: meta.emoji,
        mealItems: photos.length
          ? `已上传 ${photos.length} 张照片`
          : (m.photo_count ? `已上传 ${m.photo_count} 张照片` : '已记录'),
        photos,
      })
    })
    ;(home?.daily_posts_today || []).forEach((d) => {
      items.push({
        id: `daily-${d.id}`,
        type: 'daily',
        time: d.time || '日常',
        aiText: d.content || '',
        topic: d.topic || '日常',
        coverEmoji: d.cover_emoji || '📷',
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
    activeChild.value = {
      name: student.name || '宝贝',
      emoji: genderEmoji(student.gender),
      class: binding?.tenant?.name || '—',
      tenant: binding?.tenant?.name || '—',
      checkinLabel: arrived?.arrive_time ? `✓ ${arrived.arrive_time} 已签到` : '今日暂无签到',
      inGarden: !!(arrived && arrived.status === 'arrived'),
    }
  }

  async function loadMarketingCourses() {
    if (!activeChildId.value) {
      courses.value = []
      return
    }
    try {
      const data = await fetchCourses(activeChildId.value)
      courses.value = (data?.list || []).map(c => ({
        ...c,
        highlights: c.highlights || [],
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

  async function loadParentHome() {
    homeLoading.value = true
    try {
      const [profile, studentsRes] = await Promise.all([fetchProfile(), fetchStudents()])
      parentName.value = profile?.name || profile?.nickname || '家长'
      parentPhone.value = profile?.phone || ''

      const list = (studentsRes?.list || []).filter(i => i.binding_status === 'approved' || i.student)
      childOptions.value = list.map(i => ({
        id: i.student.id,
        name: i.student.name,
        emoji: genderEmoji(i.student.gender),
        tenant: i.tenant?.name || '—',
        binding: i,
      }))

      if (!childOptions.value.length) {
        activeChildId.value = null
        todayItems.value = []
        yesterdayItems.value = []
        courses.value = []
        activeChild.value = {
          name: '未绑定宝贝',
          emoji: '🧒',
          class: '—',
          tenant: '—',
          checkinLabel: '请先绑定',
          inGarden: false,
        }
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

  function openProfile() {
    profilePage.value = 'main'
    showProfile.value = true
  }

  function closeProfile() {
    showProfile.value = false
  }

  function goProfilePage(page) {
    profilePage.value = page
  }

  const NOTIFY_PREF_KEY = 'parent_notify_prefs'
  const defaultNotifyPrefs = () => ([
    { key: 'homework', label: '作业提醒', desc: '布置、批改与截止提醒', on: true },
    { key: 'attendance', label: '考勤提醒', desc: '到园、离园与请假结果', on: true },
    { key: 'notice', label: '园所通知', desc: '机构通知与活动安排', on: true },
    { key: 'daily', label: '日常动态', desc: '班级日常发布提醒', on: true },
  ])
  function loadNotifyPrefs() {
    try {
      const raw = uni.getStorageSync(NOTIFY_PREF_KEY)
      if (raw) {
        const saved = typeof raw === 'string' ? JSON.parse(raw) : raw
        const base = defaultNotifyPrefs()
        return base.map(b => ({ ...b, on: saved[b.key] !== false }))
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
  function toggleNotifyPref(key) {
    const row = notifyPrefs.value.find(n => n.key === key)
    if (!row) return
    row.on = !row.on
    persistNotifyPrefs()
    if (row.on) {
      const tplId = WX_SUBSCRIBE_TEMPLATES[key]
      const report = () => reportSubscribe(`parent_${key}`, 1).catch(() => {})
      if (tplId && typeof uni.requestSubscribeMessage === 'function') {
        uni.requestSubscribeMessage({
          tmplIds: [tplId],
          complete: () => report(),
        })
      } else {
        report()
      }
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
    unreadCount,
    homeLoading,
    parentName,
    parentPhone,
    parentAvatar,
    parentPhoneMasked,
    homeDate,
    homeDateLabel,
    childOptions,
    activeChildId,
    activeChild,
    todayItems,
    yesterdayItems,
    homeworkEntryHint,
    courses,
    healthArchive,
    notifyPrefs,
    notifyPrefsOnLabel,
    loadParentHome,
    refreshTimeline,
    selectChild,
    openProfile,
    closeProfile,
    goProfilePage,
    toggleNotifyPref,
    clearLocalCache,
  }
}
