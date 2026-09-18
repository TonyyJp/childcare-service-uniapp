<template>
  <view class="tab-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FF8A65 100%);">
      <view class="safe-nav-bar" style="padding-bottom:16rpx;">
        <text style="font-size:44rpx;font-weight:800;color:white;display:block;">作业中心</text>
        <text style="font-size:24rpx;color:rgba(255,255,255,0.8);display:block;margin-top:8rpx;">{{ headerHint }}</text>
      </view>
      <view style="display:flex;padding:0 40rpx;border-top:1rpx solid rgba(255,255,255,0.2);">
        <view v-for="t in hwTabs" :key="t" style="padding:20rpx 32rpx 20rpx 0;font-size:26rpx;font-weight:700;"
          :style="{ color: hwTab === t ? 'white' : 'rgba(255,255,255,0.5)', borderBottom: hwTab === t ? '3rpx solid white' : '3rpx solid transparent' }"
          @click="switchHwTab(t)"><text>{{ t }}</text></view>
      </view>
    </view>

    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <LoadingSkeleton v-if="hwLoading" variant="list" :count="3" padding="8rpx 0" />

        <!-- 作业登记：正式布置 -->
        <view v-else-if="hwTab === '作业登记'">
          <view class="primary-btn" style="margin-bottom:24rpx;" @click="openAddHw">
            <text style="color:white;font-size:30rpx;font-weight:800;">布置作业</text>
          </view>
          <view v-if="!homeworkList.length" style="padding:48rpx 0;text-align:center;">
            <text style="font-size:26rpx;color:#8D6E63;">暂无布置的作业</text>
          </view>
          <view v-for="hw in homeworkList" :key="hw.id" class="card" style="padding:24rpx;margin-bottom:20rpx;" @click="openHwFeedback(hw)">
            <view style="display:flex;align-items:center;gap:20rpx;margin-bottom:16rpx;">
              <view style="width:72rpx;height:72rpx;border-radius:20rpx;display:flex;align-items:center;justify-content:center;" :style="{ backgroundColor: hw.color }">
                <text style="color:white;font-weight:800;font-size:28rpx;">{{ (hw.className || '作')[0] }}</text>
              </view>
              <view style="flex:1;">
                <view style="display:flex;align-items:center;gap:12rpx;flex-wrap:wrap;">
                  <text style="font-size:28rpx;font-weight:700;color:#2D1F18;">{{ hw.title }}</text>
                  <view class="pill" :style="{ backgroundColor: hw.color + '18', color: hw.color }"><text style="font-size:22rpx;">{{ hw.className }}</text></view>
                  <view v-if="hw.isOverdue" class="pill" style="background:#FFEBEE;color:#C62828;"><text style="font-size:20rpx;">已截止</text></view>
                </view>
                <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:6rpx;">截止：{{ hw.due }}</text>
              </view>
            </view>
            <view style="display:flex;align-items:center;gap:16rpx;">
              <view style="flex:1;height:12rpx;border-radius:12rpx;background:#F5F0EC;overflow:hidden;">
                <view style="height:100%;border-radius:12rpx;" :style="{ width: hw.total ? (hw.submitted / hw.total * 100) + '%' : '0%', backgroundColor: hw.color }" />
              </view>
              <text style="font-size:24rpx;font-weight:700;" :style="{ color: hw.color }">{{ hw.submitted }}/{{ hw.total }} 已交</text>
            </view>
            <text style="font-size:22rpx;color:#BDBDBD;display:block;margin-top:12rpx;">已批 {{ hw.graded }} · 未交 {{ hw.unsubmitted }} · 点按查看提交</text>
          </view>
        </view>

        <!-- 作业检查：无需事先布置 -->
        <view v-else-if="hwTab === '作业检查'">
          <text style="font-size:24rpx;color:#8D6E63;display:block;margin-bottom:16rpx;">选择班级后直接检查学校作业并反馈家长，无需先布置</text>
          <scroll-view scroll-x style="white-space:nowrap;margin-bottom:20rpx;">
            <view
              v-for="c in classes"
              :key="c.id"
              @click="selectCheckClass(c.id)"
              style="display:inline-flex;padding:12rpx 24rpx;border-radius:24rpx;margin-right:12rpx;font-size:24rpx;font-weight:700;"
              :style="{ background: checkClassId === c.id ? '#FF7043' : '#F5F0EC', color: checkClassId === c.id ? 'white' : '#8D6E63' }"
            >
              <text>{{ c.name }}</text>
            </view>
          </scroll-view>

          <view v-if="checkStarting" style="padding:48rpx 0;text-align:center;">
            <text style="font-size:26rpx;color:#8D6E63;">准备检查中…</text>
          </view>
          <view v-else-if="!checkClassId" style="padding:48rpx 0;text-align:center;">
            <text style="font-size:26rpx;color:#8D6E63;">请先选择班级</text>
          </view>
          <view v-else>
            <view v-if="checkSession" class="card" style="padding:24rpx;margin-bottom:20rpx;">
              <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;">{{ checkSession.title }}</text>
              <text style="font-size:22rpx;color:#8D6E63;margin-top:6rpx;display:block;">
                已反馈 {{ checkSession.graded }}/{{ checkSession.total }}
              </text>
            </view>
            <view v-if="!checkFeedbacks.length" style="padding:32rpx 0;text-align:center;">
              <text style="font-size:26rpx;color:#8D6E63;">该班暂无在读学员</text>
            </view>
            <view
              v-for="f in checkFeedbacks"
              :key="f.studentId"
              style="display:flex;align-items:flex-start;gap:20rpx;padding:24rpx 0;border-bottom:1rpx solid #F5F0EC;"
              @click="openCheckReview(f)"
            >
              <view style="width:80rpx;height:80rpx;border-radius:40rpx;display:flex;align-items:center;justify-content:center;" :style="{ backgroundColor: f.color + '20' }">
                <text style="font-weight:700;font-size:28rpx;" :style="{ color: f.color }">{{ f.name[0] }}</text>
              </view>
              <view style="flex:1;">
                <view style="display:flex;align-items:center;gap:12rpx;margin-bottom:8rpx;">
                  <text style="font-weight:700;font-size:28rpx;color:#2D1F18;">{{ f.name }}</text>
                </view>
                <text style="font-size:24rpx;color:#8D6E63;">{{ f.hint }}</text>
              </view>
              <view class="pill" :style="feedbackStatusStyle(f.status)"><text style="font-size:22rpx;font-weight:700;">{{ f.statusLabel }}</text></view>
            </view>
          </view>
        </view>

        <!-- 作业反馈：布置后的家长提交批改 -->
        <view v-else-if="hwTab === '作业反馈'">
          <view v-if="!selectedHw" style="padding:48rpx 0;text-align:center;">
            <text style="font-size:26rpx;color:#8D6E63;">请先在「作业登记」点选一份作业</text>
          </view>
          <view v-else>
            <view class="card" style="padding:24rpx;margin-bottom:20rpx;">
              <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;">{{ selectedHw.title }}</text>
              <text style="font-size:22rpx;color:#8D6E63;margin-top:6rpx;display:block;">{{ selectedHw.className }} · 截止 {{ selectedHw.due }}</text>
            </view>
            <view v-if="!feedbacks.length" style="padding:32rpx 0;text-align:center;">
              <text style="font-size:26rpx;color:#8D6E63;">暂无目标学员</text>
            </view>
            <view v-for="f in feedbacks" :key="f.studentId" style="display:flex;align-items:flex-start;gap:20rpx;padding:24rpx 0;border-bottom:1rpx solid #F5F0EC;" @click="openAssignedReview(f)">
              <view style="width:80rpx;height:80rpx;border-radius:40rpx;display:flex;align-items:center;justify-content:center;" :style="{ backgroundColor: f.color + '20' }">
                <text style="font-weight:700;font-size:28rpx;" :style="{ color: f.color }">{{ f.name[0] }}</text>
              </view>
              <view style="flex:1;">
                <view style="display:flex;align-items:center;gap:12rpx;margin-bottom:8rpx;">
                  <text style="font-weight:700;font-size:28rpx;color:#2D1F18;">{{ f.name }}</text>
                  <text v-if="f.submittedAt" style="font-size:22rpx;color:#BDBDBD;">{{ f.submittedAt }}</text>
                </view>
                <text style="font-size:24rpx;color:#8D6E63;">{{ f.hint }}</text>
              </view>
              <view class="pill" :style="feedbackStatusStyle(f.status)"><text style="font-size:22rpx;font-weight:700;">{{ f.statusLabel }}</text></view>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="showAddHw" class="overlay" @click="showAddHw = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">布置作业</text>
        <view style="display:flex;flex-direction:column;gap:24rpx;">
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">班级</text>
            <view style="display:flex;flex-wrap:wrap;gap:12rpx;">
              <view v-for="c in classes" :key="c.id" class="pill" style="padding:12rpx 20rpx;"
                :style="{ backgroundColor: newHw.classId === c.id ? '#FF7043' : '#F5F0EC', color: newHw.classId === c.id ? 'white' : '#8D6E63' }"
                @click="newHw.classId = c.id"><text style="font-size:24rpx;">{{ c.name }}</text></view>
            </view>
          </view>
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">标题</text>
            <input class="form-input" placeholder="如：绘本复述练习" v-model="newHw.title" />
          </view>
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">内容要求</text>
            <textarea class="form-input" style="height:140rpx;padding-top:16rpx;" placeholder="请家长协助完成…" v-model="newHw.content" />
          </view>
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">截止时间</text>
            <view style="display:flex;flex-wrap:wrap;gap:12rpx;">
              <view v-for="opt in deadlineOptions" :key="opt.label" class="pill" style="padding:12rpx 20rpx;"
                :style="{ backgroundColor: newHw.deadlineKey === opt.label ? '#FF7043' : '#F5F0EC', color: newHw.deadlineKey === opt.label ? 'white' : '#8D6E63' }"
                @click="pickDeadline(opt)"><text style="font-size:24rpx;">{{ opt.label }}</text></view>
            </view>
            <text style="font-size:22rpx;color:#BDBDBD;margin-top:8rpx;display:block;">{{ newHw.deadline || '请选择' }}</text>
          </view>
          <view class="primary-btn" :style="{ opacity: hwPublishing ? 0.6 : 1 }" @click="publishHomework">
            <text style="color:white;font-size:30rpx;font-weight:800;">{{ hwPublishing ? '发布中…' : '发布作业' }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showReview" class="overlay" @click="showReview = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">{{ reviewMode === 'check' ? '作业检查' : '批改' }} · {{ reviewTarget?.name || '' }}</text>
        <view style="display:flex;flex-direction:column;gap:24rpx;">
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">评级</text>
            <view style="display:flex;flex-wrap:wrap;gap:12rpx;">
              <view v-for="g in gradeOptions" :key="g.value" class="pill" style="padding:12rpx 24rpx;"
                :style="{ backgroundColor: reviewForm.grade === g.value ? g.color : '#F5F0EC', color: reviewForm.grade === g.value ? 'white' : '#8D6E63' }"
                @click="reviewForm.grade = g.value"><text style="font-size:26rpx;font-weight:700;">{{ g.label }}</text></view>
            </view>
          </view>
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">评语</text>
            <textarea class="form-input" style="height:140rpx;padding-top:16rpx;" :placeholder="reviewMode === 'check' ? '学校作业完成情况、督促说明…' : '给家长的反馈…'" v-model="reviewForm.text" />
          </view>
          <view class="primary-btn" :style="{ opacity: reviewBusy ? 0.6 : 1 }" @click="submitReview">
            <text style="color:white;font-size:30rpx;font-weight:800;">{{ reviewBusy ? '提交中…' : (reviewMode === 'check' ? '确认反馈' : '确认批改') }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { ref, computed, inject, onMounted } from 'vue'
import {
  createHomework,
  feedbackHomework,
  fetchDashboard,
  fetchHomeworkSubmissions,
  fetchHomeworks,
  reviewSubmission,
  startHomeworkCheck,
} from '../../api/teacher.js'

const AVATAR_COLORS = ['#FF7043', '#AB47BC', '#3B9EEB', '#66BB6A', '#FFA726', '#EC407A']
const GRADE_LABEL = { excellent: '优', good: '良', fair: '中', weak: '待加强' }
const checkinClassId = inject('teacherCheckinClassId', null)

const hwTabs = ['作业登记', '作业检查', '作业反馈']
const hwTab = ref('作业登记')
const hwLoading = ref(false)
const hwPublishing = ref(false)
const showAddHw = ref(false)
const homeworkList = ref([])
const selectedHw = ref(null)
const feedbacks = ref([])
const showReview = ref(false)
const reviewBusy = ref(false)
const reviewMode = ref('assigned') // assigned | check
const reviewTarget = ref(null)
const reviewForm = ref({ grade: 'good', text: '' })
const gradeOptions = [
  { value: 'excellent', label: '优', color: '#66BB6A' },
  { value: 'good', label: '良', color: '#3B9EEB' },
  { value: 'fair', label: '中', color: '#FFA726' },
  { value: 'weak', label: '待加强', color: '#EF5350' },
]
const newHw = ref({ classId: null, title: '', content: '', deadline: '', deadlineKey: '' })
const classes = ref([])
const primaryClassName = ref('—')

const checkClassId = ref(null)
const checkStarting = ref(false)
const checkSession = ref(null)
const checkFeedbacks = ref([])

const headerHint = computed(() => {
  if (hwTab.value === '作业检查') {
    return checkSession.value?.title || `${primaryClassName.value} · 现场检查`
  }
  if (hwTab.value === '作业反馈' && selectedHw.value) {
    return selectedHw.value.title
  }
  return `${primaryClassName.value} · ${homeworkList.value.length} 份布置`
})

function formatDeadlineLocal(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d} 17:00:00`
}

const deadlineOptions = (() => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 2)
  const friday = new Date()
  const day = friday.getDay()
  const add = day <= 5 ? (5 - day || 7) : 6
  friday.setDate(friday.getDate() + add)
  return [
    { label: '明天 17:00', value: formatDeadlineLocal(tomorrow) },
    { label: '后天 17:00', value: formatDeadlineLocal(dayAfter) },
    { label: '本周五 17:00', value: formatDeadlineLocal(friday) },
  ]
})()

function mapHomeworkRow(hw, index) {
  const stats = hw.stats || {}
  return {
    id: hw.id,
    title: hw.title,
    classId: hw.class_id,
    className: hw.class_name || '班级',
    due: hw.deadline,
    kind: hw.kind || 'assigned',
    isOverdue: !!hw.is_overdue,
    submitted: stats.submitted || 0,
    total: stats.total || 0,
    graded: stats.graded || 0,
    unsubmitted: stats.unsubmitted || 0,
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    status: hw.status
  }
}

function mapStudentRow(row, i) {
  const statusLabel = { unsubmitted: '待检查', submitted: '待批改', graded: '已反馈' }[row.status] || row.status
  let hint = '点按填写完成情况'
  if (row.status === 'graded') {
    hint = row.text_feedback || `已评「${GRADE_LABEL[row.grade] || row.grade}」`
  } else if (row.status === 'submitted') {
    hint = '家长已提交，点按批改'
  }
  return {
    studentId: row.student_id,
    submissionId: row.submission_id,
    name: row.student_name,
    status: row.status,
    statusLabel,
    submittedAt: row.submitted_at || '',
    grade: row.grade || '',
    textFeedback: row.text_feedback || '',
    hint,
    color: AVATAR_COLORS[i % AVATAR_COLORS.length]
  }
}

async function loadClasses() {
  try {
    const dash = await fetchDashboard()
    classes.value = (dash?.classes || []).map((c, i) => ({
      id: c.id,
      name: c.biz_type === 'care'
        ? `${c.name}·${c.attendance_type_name || '托管'}`
        : `${c.name}·兴趣`,
      expected: c.students_count || (c.periods || []).reduce((s, p) => s + (p.expected || 0), 0),
      bizType: c.biz_type,
    }))
    primaryClassName.value = classes.value[0]?.name || '—'
  } catch (_) { /* ignore */ }
}

async function loadHomeworks() {
  hwLoading.value = true
  try {
    const data = await fetchHomeworks({ status: 'published', kind: 'assigned', perPage: 50 })
    homeworkList.value = (data?.list || []).map(mapHomeworkRow)
  } catch (e) {
    uni.showToast({ title: e.message || '作业列表加载失败', icon: 'none' })
  } finally {
    hwLoading.value = false
  }
}

function switchHwTab(t) {
  hwTab.value = t
  if (t === '作业登记') loadHomeworks()
  if (t === '作业反馈' && selectedHw.value) loadHwSubmissions(selectedHw.value.id)
  if (t === '作业检查') {
    const preferred =
      checkClassId.value ||
      checkinClassId?.value ||
      classes.value.find(c => c.bizType === 'care')?.id ||
      classes.value[0]?.id ||
      null
    if (preferred) selectCheckClass(preferred)
  }
}

function openAddHw() {
  const preferred =
    checkinClassId?.value ||
    classes.value.find(c => c.expected > 0)?.id ||
    classes.value[0]?.id ||
    null
  newHw.value = {
    classId: preferred,
    title: '',
    content: '',
    deadline: deadlineOptions[0].value,
    deadlineKey: deadlineOptions[0].label
  }
  showAddHw.value = true
}

function pickDeadline(opt) {
  newHw.value.deadline = opt.value
  newHw.value.deadlineKey = opt.label
}

async function publishHomework() {
  if (hwPublishing.value) return
  const payload = newHw.value
  if (!payload.classId) {
    uni.showToast({ title: '请选择班级', icon: 'none' })
    return
  }
  if (!payload.title?.trim() || !payload.content?.trim()) {
    uni.showToast({ title: '请填写标题和内容', icon: 'none' })
    return
  }
  if (!payload.deadline) {
    uni.showToast({ title: '请选择截止时间', icon: 'none' })
    return
  }
  hwPublishing.value = true
  try {
    await createHomework({
      class_id: payload.classId,
      title: payload.title.trim(),
      content: payload.content.trim(),
      deadline: payload.deadline,
      target_type: 'all'
    })
    showAddHw.value = false
    uni.showToast({ title: '已发布', icon: 'success' })
    hwTab.value = '作业登记'
    await loadHomeworks()
  } catch (e) {
    uni.showToast({ title: e.message || '发布失败', icon: 'none' })
  } finally {
    hwPublishing.value = false
  }
}

async function selectCheckClass(classId) {
  if (!classId) return
  checkClassId.value = classId
  checkStarting.value = true
  checkFeedbacks.value = []
  try {
    const session = await startHomeworkCheck({ class_id: classId })
    checkSession.value = {
      id: session.id,
      title: session.title,
      total: session.stats?.total || 0,
      graded: session.stats?.graded || 0,
    }
    const data = await fetchHomeworkSubmissions(session.id)
    checkFeedbacks.value = (data?.list || []).map(mapStudentRow)
  } catch (e) {
    checkSession.value = null
    uni.showToast({ title: e.message || '无法开始检查', icon: 'none' })
  } finally {
    checkStarting.value = false
  }
}

async function openHwFeedback(hw) {
  selectedHw.value = hw
  hwTab.value = '作业反馈'
  await loadHwSubmissions(hw.id)
}

async function loadHwSubmissions(homeworkId) {
  try {
    const data = await fetchHomeworkSubmissions(homeworkId)
    feedbacks.value = (data?.list || []).map((row, i) => {
      const mapped = mapStudentRow(row, i)
      if (row.status === 'unsubmitted') {
        mapped.statusLabel = '未提交'
        mapped.hint = '尚未提交'
      } else if (row.status === 'graded') {
        mapped.statusLabel = '已批改'
        mapped.hint = row.text_feedback || '已批改，可再次修改评级'
      } else {
        mapped.statusLabel = '待批改'
        mapped.hint = '已提交，点按批改'
      }
      return mapped
    })
  } catch (e) {
    uni.showToast({ title: e.message || '提交列表加载失败', icon: 'none' })
  }
}

function feedbackStatusStyle(status) {
  if (status === 'graded') return { backgroundColor: '#C8E6C9', color: '#2E7D32' }
  if (status === 'submitted') return { backgroundColor: '#FFF3E0', color: '#E65100' }
  return { backgroundColor: '#EEEEEE', color: '#757575' }
}

function openCheckReview(f) {
  reviewMode.value = 'check'
  reviewTarget.value = f
  reviewForm.value = {
    grade: f.grade || 'good',
    text: f.textFeedback || ''
  }
  showReview.value = true
}

function openAssignedReview(f) {
  if (f.status === 'unsubmitted' || !f.submissionId) {
    uni.showToast({ title: '该学员尚未提交', icon: 'none' })
    return
  }
  reviewMode.value = 'assigned'
  reviewTarget.value = f
  reviewForm.value = { grade: 'good', text: '' }
  showReview.value = true
}

async function submitReview() {
  if (reviewBusy.value || !reviewTarget.value) return
  reviewBusy.value = true
  try {
    if (reviewMode.value === 'check') {
      if (!checkSession.value?.id) throw new Error('检查会话无效')
      await feedbackHomework(checkSession.value.id, {
        student_id: reviewTarget.value.studentId,
        grade: reviewForm.value.grade,
        text_feedback: reviewForm.value.text?.trim() || undefined,
      })
      showReview.value = false
      uni.showToast({ title: '已反馈', icon: 'success' })
      await selectCheckClass(checkClassId.value)
    } else {
      if (!reviewTarget.value.submissionId) throw new Error('缺少提交')
      await reviewSubmission(reviewTarget.value.submissionId, {
        grade: reviewForm.value.grade,
        text_feedback: reviewForm.value.text?.trim() || undefined
      })
      showReview.value = false
      uni.showToast({ title: '批改完成', icon: 'success' })
      if (selectedHw.value) await loadHwSubmissions(selectedHw.value.id)
      loadHomeworks()
    }
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    reviewBusy.value = false
  }
}

onMounted(async () => {
  await loadClasses()
  await loadHomeworks()
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
