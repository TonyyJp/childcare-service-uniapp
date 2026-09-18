<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#AB47BC 0%,#CE93D8 100%);">
      <view style="padding:0 40rpx 24rpx;">
          <view style="display:flex;align-items:center;margin-bottom:16rpx;">
            <view class="back-btn" @click="navigate('home')"><text class="back-icon">‹</text></view>
            <view style="flex:1;margin-left:20rpx;min-width:0;">
              <text style="font-size:40rpx;font-weight:800;color:white;display:block;">试课预约</text>
              <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">待确认 {{ pendingCount }} 条</text>
            </view>
          </view>
          <view style="display:flex;justify-content:flex-end;margin-bottom:16rpx;">
            <view style="background:rgba(255,255,255,0.25);border-radius:20rpx;padding:12rpx 28rpx;" hover-class="mp-tap-soft" :hover-stay-time="80" @click="openCreate">
              <text style="color:white;font-size:24rpx;font-weight:700;">+ 代录</text>
            </view>
          </view>
        <scroll-view scroll-x style="white-space:nowrap;">
          <view
            v-for="f in filters"
            :key="f.value"
            class="pill"
            style="display:inline-flex;padding:12rpx 24rpx;margin-right:12rpx;"
            :style="{ backgroundColor: filter === f.value ? 'white' : 'rgba(255,255,255,0.2)', color: filter === f.value ? '#AB47BC' : 'white' }"
            @click="setFilter(f.value)"
          >
            <text style="font-size:22rpx;font-weight:700;">{{ f.label }}</text>
          </view>
        </scroll-view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <LoadingSkeleton v-if="loading" variant="list" :count="3" padding="8rpx 0" />
        <view v-else-if="errorMsg" style="padding:48rpx 24rpx;text-align:center;">
          <text style="font-size:28rpx;font-weight:700;color:#2D1F18;display:block;margin-bottom:12rpx;">暂时无法加载</text>
          <text style="font-size:24rpx;color:#8D6E63;display:block;margin-bottom:24rpx;">{{ errorMsg }}</text>
          <view class="action-btn" style="display:inline-flex;background:#AB47BC;padding:16rpx 32rpx;" @click="loadList">
            <text style="color:white;font-size:26rpx;font-weight:700;">重试</text>
          </view>
        </view>
        <view v-else-if="!list.length" style="padding:48rpx 0;text-align:center;">
          <text style="font-size:26rpx;color:#8D6E63;">暂无记录</text>
        </view>
        <view v-for="row in list" :key="row.id" class="card" style="padding:24rpx;margin-bottom:16rpx;">
          <view style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12rpx;">
            <view style="flex:1;min-width:0;">
              <text style="font-size:28rpx;font-weight:800;color:#2D1F18;display:block;">{{ row.student_name || '学员' }}</text>
              <text style="font-size:22rpx;color:#8D6E63;display:block;margin-top:6rpx;">{{ row.class_name || '兴趣课' }}</text>
            </view>
            <view class="pill" :style="statusStyle(row.status)">
              <text style="font-size:20rpx;font-weight:700;">{{ statusLabel(row.status) }}</text>
            </view>
          </view>
          <text v-if="lessonLine(row)" style="font-size:24rpx;color:#2D1F18;display:block;margin-bottom:8rpx;">{{ lessonLine(row) }}</text>
          <text v-if="row.lesson_content" style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:8rpx;">{{ row.lesson_content }}</text>
          <text v-if="row.remark" style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:6rpx;">家长：{{ row.remark }}</text>
          <text v-if="row.staff_remark" style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:6rpx;">内部：{{ row.staff_remark }}</text>
          <text v-if="row.contact_name || row.contact_phone" style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:8rpx;">
            联系 {{ row.contact_name || '—' }} {{ row.contact_phone || '' }}
          </text>
          <text v-if="row.fee_received" style="font-size:22rpx;color:#E65100;display:block;margin-bottom:8rpx;">
            已收试课费{{ row.fee_note ? ` · ${row.fee_note}` : '' }}
          </text>
          <text v-if="row.cancel_reason" style="font-size:22rpx;color:#E53935;display:block;margin-bottom:8rpx;">取消：{{ row.cancel_reason }}</text>
          <text v-if="row.status === 'converted'" style="font-size:22rpx;color:#2E7D32;display:block;margin-bottom:8rpx;">
            已转正 {{ row.converted_class_name || row.class_name }}
          </text>
          <view v-if="row.status === 'pending'" style="display:flex;margin-top:12rpx;">
            <view style="flex:1;padding:16rpx;border-radius:16rpx;background:#E8F5E9;text-align:center;margin-right:16rpx;" @click="openSchedule(row)">
              <text style="font-size:26rpx;font-weight:700;color:#2E7D32;">确认排课</text>
            </view>
            <view style="flex:1;padding:16rpx;border-radius:16rpx;background:#FFEBEE;text-align:center;" @click="openCancel(row)">
              <text style="font-size:26rpx;font-weight:700;color:#E53935;">取消</text>
            </view>
          </view>
          <view v-else-if="row.status === 'scheduled'" style="display:flex;margin-top:12rpx;">
            <view style="flex:1;padding:16rpx;border-radius:16rpx;background:#FFEBEE;text-align:center;" @click="openCancel(row)">
              <text style="font-size:26rpx;font-weight:700;color:#E53935;">取消预约</text>
            </view>
          </view>
          <view v-else-if="row.status === 'attended'" style="margin-top:12rpx;padding:16rpx;border-radius:16rpx;background:linear-gradient(135deg,#AB47BC,#CE93D8);text-align:center;" @click="openConvert(row)">
            <text style="font-size:26rpx;font-weight:700;color:white;">转正报名</text>
          </view>
        </view>
        <text style="font-size:22rpx;color:#8D6E63;display:block;margin:8rpx 0 32rpx;line-height:1.6;">复杂收费请到电脑端机构后台</text>
      </view>
    </scroll-view>

    <!-- 确认排课 -->
    <view v-if="showSchedule" class="overlay-mask" style="z-index:70;" @click="showSchedule = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">确认排课</text>
        <text style="font-size:24rpx;color:#8D6E63;display:block;margin-bottom:16rpx;">
          {{ scheduleTarget?.student_name }} · {{ scheduleTarget?.class_name }}
        </text>
        <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">选择课次</text>
        <view v-if="lessonsLoading" style="padding:16rpx 0;">
          <text style="font-size:24rpx;color:#8D6E63;">加载课次…</text>
        </view>
        <view v-else-if="!lessonOptions.length" style="padding:8rpx 0 16rpx;">
          <text style="font-size:24rpx;color:#E53935;">暂无可排课次，请到电脑端确认课表</text>
        </view>
        <scroll-view v-else scroll-y style="max-height:360rpx;margin-bottom:16rpx;">
          <view
            v-for="l in lessonOptions"
            :key="l.sort"
            class="pill"
            style="display:block;padding:16rpx 20rpx;margin-bottom:12rpx;"
            :style="{ backgroundColor: scheduleForm.lessonSort === l.sort ? '#AB47BC18' : '#F5F0EC', color: scheduleForm.lessonSort === l.sort ? '#AB47BC' : '#8D6E63' }"
            @click="scheduleForm.lessonSort = l.sort"
          >
            <text style="font-size:24rpx;font-weight:700;">{{ l.label }}</text>
          </view>
        </scroll-view>
        <view style="display:flex;align-items:center;margin-bottom:16rpx;" @click="scheduleForm.feeReceived = !scheduleForm.feeReceived">
          <view style="width:36rpx;height:36rpx;border-radius:8rpx;margin-right:12rpx;border:2rpx solid #AB47BC;" :style="{ backgroundColor: scheduleForm.feeReceived ? '#AB47BC' : 'transparent' }" />
          <text style="font-size:26rpx;color:#2D1F18;">已收试课费（线下）</text>
        </view>
        <textarea
          v-if="scheduleForm.feeReceived"
          class="form-input"
          style="height:100rpx;margin-bottom:16rpx;"
          :value="scheduleForm.feeNote"
          placeholder="收款说明（可选）"
          @input="e => scheduleForm.feeNote = e.detail.value"
        />
        <text style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:20rpx;">复杂收费请到电脑端机构后台</text>
        <view class="primary-btn" :style="{ opacity: busy ? 0.6 : 1 }" @click="confirmSchedule">
          <text style="color:white;font-size:30rpx;font-weight:800;">{{ busy ? '提交中…' : '确认排入课次' }}</text>
        </view>
      </view>
    </view>

    <!-- 取消 -->
    <view v-if="showCancel" class="overlay-mask" style="z-index:70;" @click="showCancel = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">取消试课</text>
        <text style="font-size:24rpx;color:#8D6E63;display:block;margin-bottom:16rpx;">
          {{ cancelTarget?.student_name }} · {{ cancelTarget?.class_name }}
        </text>
        <textarea class="form-input" style="height:140rpx;" :value="cancelReason" placeholder="请填写取消原因（必填）" @input="e => cancelReason = e.detail.value" />
        <view style="margin-top:24rpx;padding:24rpx;border-radius:20rpx;background:linear-gradient(135deg,#E53935,#EF5350);text-align:center;" :style="{ opacity: busy ? 0.6 : 1 }" @click="confirmCancel">
          <text style="color:white;font-size:30rpx;font-weight:800;">确认取消</text>
        </view>
      </view>
    </view>

    <!-- 代录 -->
    <view v-if="showCreate" class="overlay-mask" style="z-index:70;" @click="showCreate = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">代录试课</text>
        <view style="display:flex;flex-direction:column;gap:20rpx;">
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">学员</text>
            <scroll-view scroll-y style="max-height:240rpx;">
              <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
                <view
                  v-for="s in students"
                  :key="s.id"
                  class="pill"
                  style="padding:12rpx 20rpx;"
                  :style="{ backgroundColor: createForm.studentId === s.id ? '#AB47BC18' : '#F5F0EC', color: createForm.studentId === s.id ? '#AB47BC' : '#8D6E63' }"
                  @click="createForm.studentId = s.id"
                >
                  <text style="font-size:22rpx;">{{ s.name }}</text>
                </view>
              </view>
            </scroll-view>
            <text v-if="!students.length" style="font-size:22rpx;color:#E53935;">暂无在册学员</text>
          </view>
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">兴趣课班</text>
            <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
              <view
                v-for="c in interestClasses"
                :key="c.id"
                class="pill"
                style="padding:12rpx 20rpx;"
                :style="{ backgroundColor: createForm.classId === c.id ? '#AB47BC18' : '#F5F0EC', color: createForm.classId === c.id ? '#AB47BC' : '#8D6E63' }"
                @click="onCreateClass(c.id)"
              >
                <text style="font-size:22rpx;">{{ c.name }}</text>
              </view>
            </view>
          </view>
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">课次（可选，选了可直接排课）</text>
            <view v-if="lessonsLoading">
              <text style="font-size:22rpx;color:#8D6E63;">加载课次…</text>
            </view>
            <view v-else style="display:flex;gap:12rpx;flex-wrap:wrap;">
              <view
                class="pill"
                style="padding:12rpx 20rpx;"
                :style="{ backgroundColor: !createForm.lessonSort ? '#AB47BC18' : '#F5F0EC', color: !createForm.lessonSort ? '#AB47BC' : '#8D6E63' }"
                @click="createForm.lessonSort = null"
              >
                <text style="font-size:22rpx;">先待确认</text>
              </view>
              <view
                v-for="l in lessonOptions"
                :key="l.sort"
                class="pill"
                style="padding:12rpx 20rpx;"
                :style="{ backgroundColor: createForm.lessonSort === l.sort ? '#AB47BC18' : '#F5F0EC', color: createForm.lessonSort === l.sort ? '#AB47BC' : '#8D6E63' }"
                @click="createForm.lessonSort = l.sort"
              >
                <text style="font-size:22rpx;">{{ l.shortLabel }}</text>
              </view>
            </view>
          </view>
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">内部备注</text>
            <textarea class="form-input" style="height:100rpx;" :value="createForm.staffRemark" placeholder="可选" @input="e => createForm.staffRemark = e.detail.value" />
          </view>
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">家长备注</text>
            <textarea class="form-input" style="height:100rpx;" :value="createForm.remark" placeholder="可选" @input="e => createForm.remark = e.detail.value" />
          </view>
        </view>
        <text style="font-size:22rpx;color:#8D6E63;display:block;margin:16rpx 0;">复杂收费请到电脑端机构后台</text>
        <view class="primary-btn" :style="{ opacity: busy ? 0.6 : 1 }" @click="submitCreate">
          <text style="color:white;font-size:30rpx;font-weight:800;">{{ busy ? '提交中…' : '提交代录' }}</text>
        </view>
      </view>
    </view>

    <!-- 转正 -->
    <view v-if="showConvert" class="overlay-mask" style="z-index:70;" @click="showConvert = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">转正报名 · {{ convertTarget?.student_name }}</text>
        <view style="display:flex;flex-direction:column;gap:20rpx;margin-bottom:20rpx;">
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">目标课班</text>
            <picker :range="interestClassNames" :value="convertClassIndex" @change="onConvertClassChange">
              <view class="form-input">{{ interestClassNames[convertClassIndex] || convertTarget?.class_name || '请选择课班' }}</view>
            </picker>
          </view>
          <view style="display:flex;align-items:center;" @click="convertForm.grantPackage = !convertForm.grantPackage">
            <view style="width:36rpx;height:36rpx;border-radius:8rpx;margin-right:12rpx;border:2rpx solid #AB47BC;" :style="{ backgroundColor: convertForm.grantPackage ? '#AB47BC' : 'transparent' }" />
            <text style="font-size:26rpx;color:#2D1F18;">同时发放课时包</text>
          </view>
          <template v-if="convertForm.grantPackage">
            <view>
              <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">课时数</text>
              <input class="form-input" type="number" :value="convertForm.totalLessons" placeholder="如 10" @input="e => convertForm.totalLessons = e.detail.value" />
            </view>
            <view>
              <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">有效期从</text>
              <picker mode="date" :value="convertForm.validFrom" @change="e => convertForm.validFrom = e.detail.value">
                <view class="form-input">{{ convertForm.validFrom || '选择日期' }}</view>
              </picker>
            </view>
            <view>
              <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:12rpx;">有效期至</text>
              <picker mode="date" :value="convertForm.validTo" @change="e => convertForm.validTo = e.detail.value">
                <view class="form-input">{{ convertForm.validTo || '选择日期' }}</view>
              </picker>
            </view>
          </template>
        </view>
        <text style="font-size:22rpx;color:#8D6E63;display:block;margin-bottom:20rpx;line-height:1.6;">复杂收费请到电脑端机构后台</text>
        <view class="primary-btn" :style="{ opacity: busy ? 0.6 : 1 }" @click="confirmConvert">
          <text style="color:white;font-size:30rpx;font-weight:800;">{{ busy ? '提交中…' : '确认转正' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import LoadingSkeleton from '../LoadingSkeleton.vue'
import { computed, ref, watch } from 'vue'
import {
  cancelTrialBooking,
  convertTrialBooking,
  createTrialBooking,
  fetchInterestClasses,
  fetchStudents,
  fetchTrialBookingLessons,
  fetchTrialBookings,
  scheduleTrialBooking,
} from '../../api/institution.js'
import { todayYmd } from '../../utils/lessonAttend.js'

const props = defineProps({
  pageShowCount: { type: Number, default: 0 },
})
const emit = defineEmits(['navigate'])

function navigate(tab) {
  emit('navigate', tab)
}

const filters = [
  { value: 'pending', label: '待确认' },
  { value: 'scheduled', label: '已排课' },
  { value: 'attended', label: '已到课' },
  { value: '', label: '全部' },
]
const filter = ref('pending')
const list = ref([])
const loading = ref(false)
const errorMsg = ref('')
const busy = ref(false)
const pendingCount = ref(0)

const students = ref([])
const interestClasses = ref([])
const lessonOptions = ref([])
const lessonsLoading = ref(false)

const showSchedule = ref(false)
const scheduleTarget = ref(null)
const scheduleForm = ref({ lessonSort: null, feeReceived: false, feeNote: '' })

const showCancel = ref(false)
const cancelTarget = ref(null)
const cancelReason = ref('')

const showCreate = ref(false)
const createForm = ref({
  studentId: null,
  classId: null,
  lessonSort: null,
  remark: '',
  staffRemark: '',
})

const showConvert = ref(false)
const convertTarget = ref(null)
const convertClassIndex = ref(0)
const convertForm = ref({
  grantPackage: false,
  totalLessons: '10',
  validFrom: '',
  validTo: '',
})

const interestClassNames = computed(() =>
  interestClasses.value.map(c => c.name || c.title || `课班#${c.id}`)
)

function statusLabel(s) {
  return ({
    pending: '待确认',
    scheduled: '已排课',
    attended: '已到课',
    absent: '未到课',
    cancelled: '已取消',
    converted: '已转正',
    expired: '已过期',
  })[s] || s || '—'
}

function statusStyle(s) {
  const map = {
    pending: { background: '#FFF9C4', color: '#F57F17' },
    scheduled: { background: '#E3F2FD', color: '#1565C0' },
    attended: { background: '#C8E6C9', color: '#2E7D32' },
    absent: { background: '#FFCDD2', color: '#C62828' },
    cancelled: { background: '#EEEEEE', color: '#757575' },
    converted: { background: '#EDE7F6', color: '#7B1FA2' },
    expired: { background: '#EEEEEE', color: '#757575' },
  }
  return map[s] || map.cancelled
}

function lessonLine(row) {
  const bits = []
  if (row.lesson_sort) bits.push(`第${row.lesson_sort}节`)
  if (row.lesson_date) bits.push(row.lesson_date)
  if (row.start_time || row.end_time) {
    bits.push([row.start_time, row.end_time].filter(Boolean).join('-'))
  }
  return bits.join(' · ')
}

function normalizeLessons(data, classObj) {
  const raw = data?.list || data?.lessons || data?.lesson_plan || classObj?.lesson_plan || []
  return (Array.isArray(raw) ? raw : []).map((l) => {
    const sort = l.sort ?? l.lesson_sort
    const date = l.date || l.lesson_date || ''
    const start = l.start_time || ''
    const end = l.end_time || ''
    const content = l.content || l.lesson_content || ''
    const time = [start, end].filter(Boolean).join('-')
    const label = [`第${sort}节`, date, time, content].filter(Boolean).join(' · ')
    const shortLabel = [`第${sort}节`, date].filter(Boolean).join(' ')
    return { sort, date, start_time: start, end_time: end, content, label, shortLabel }
  }).filter(l => l.sort != null)
}

async function ensureInterestClasses(force = false) {
  if (interestClasses.value.length && !force) return
  try {
    const data = await fetchInterestClasses()
    interestClasses.value = data?.list || data?.classes || []
  } catch (e) {
    interestClasses.value = []
    uni.showToast({ title: e.message || '课班加载失败', icon: 'none' })
  }
}

async function ensureStudents() {
  if (students.value.length) return
  try {
    const data = await fetchStudents()
    students.value = data?.list || []
  } catch (e) {
    students.value = []
    uni.showToast({ title: e.message || '学员加载失败', icon: 'none' })
  }
}

async function loadLessons(classId) {
  lessonOptions.value = []
  if (!classId) return
  lessonsLoading.value = true
  try {
    const data = await fetchTrialBookingLessons(classId)
    lessonOptions.value = normalizeLessons(data)
  } catch (_) {
    const cls = interestClasses.value.find(c => c.id === classId)
    if (cls?.lesson_plan?.length) {
      lessonOptions.value = normalizeLessons({ lesson_plan: cls.lesson_plan }, cls)
    } else {
      await ensureInterestClasses(true)
      const again = interestClasses.value.find(c => c.id === classId)
      if (again?.lesson_plan?.length) {
        lessonOptions.value = normalizeLessons({ lesson_plan: again.lesson_plan }, again)
      }
    }
  } finally {
    lessonsLoading.value = false
  }
}

async function loadList() {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await fetchTrialBookings({ status: filter.value || undefined })
    list.value = data?.list || data?.bookings || []
    pendingCount.value = data?.pending_count ?? list.value.filter(r => r.status === 'pending').length
  } catch (e) {
    list.value = []
    errorMsg.value = e.message || '试课列表加载失败'
    uni.showToast({ title: errorMsg.value, icon: 'none' })
  } finally {
    loading.value = false
  }
}

function setFilter(value) {
  filter.value = value
  loadList()
}

async function openSchedule(row) {
  scheduleTarget.value = row
  scheduleForm.value = { lessonSort: row.lesson_sort || null, feeReceived: !!row.fee_received, feeNote: row.fee_note || '' }
  showSchedule.value = true
  await ensureInterestClasses()
  await loadLessons(row.class_id)
}

async function confirmSchedule() {
  if (busy.value || !scheduleTarget.value?.id) return
  if (!scheduleForm.value.lessonSort) {
    uni.showToast({ title: '请选择课次', icon: 'none' })
    return
  }
  busy.value = true
  try {
    const payload = { lesson_sort: scheduleForm.value.lessonSort }
    if (scheduleForm.value.feeReceived) {
      payload.fee_received = true
      if (scheduleForm.value.feeNote.trim()) payload.fee_note = scheduleForm.value.feeNote.trim()
    }
    await scheduleTrialBooking(scheduleTarget.value.id, payload)
    uni.showToast({ title: '已排课', icon: 'success' })
    showSchedule.value = false
    await loadList()
  } catch (e) {
    uni.showToast({ title: e.message || '排课失败', icon: 'none' })
  } finally {
    busy.value = false
  }
}

function openCancel(row) {
  cancelTarget.value = row
  cancelReason.value = ''
  showCancel.value = true
}

async function confirmCancel() {
  const reason = (cancelReason.value || '').trim()
  if (!reason) {
    uni.showToast({ title: '请填写取消原因', icon: 'none' })
    return
  }
  if (busy.value || !cancelTarget.value?.id) return
  busy.value = true
  try {
    await cancelTrialBooking(cancelTarget.value.id, reason)
    uni.showToast({ title: '已取消', icon: 'success' })
    showCancel.value = false
    await loadList()
  } catch (e) {
    uni.showToast({ title: e.message || '取消失败', icon: 'none' })
  } finally {
    busy.value = false
  }
}

async function openCreate() {
  createForm.value = {
    studentId: null,
    classId: null,
    lessonSort: null,
    remark: '',
    staffRemark: '',
  }
  lessonOptions.value = []
  showCreate.value = true
  await Promise.all([ensureStudents(), ensureInterestClasses()])
}

async function onCreateClass(id) {
  createForm.value.classId = id
  createForm.value.lessonSort = null
  await loadLessons(id)
}

async function submitCreate() {
  if (busy.value) return
  if (!createForm.value.studentId) {
    uni.showToast({ title: '请选择学员', icon: 'none' })
    return
  }
  if (!createForm.value.classId) {
    uni.showToast({ title: '请选择课班', icon: 'none' })
    return
  }
  busy.value = true
  try {
    const payload = {
      student_id: createForm.value.studentId,
      class_id: createForm.value.classId,
    }
    if (createForm.value.lessonSort) payload.lesson_sort = createForm.value.lessonSort
    if (createForm.value.remark.trim()) payload.remark = createForm.value.remark.trim()
    if (createForm.value.staffRemark.trim()) payload.staff_remark = createForm.value.staffRemark.trim()
    await createTrialBooking(payload)
    uni.showToast({ title: '已代录', icon: 'success' })
    showCreate.value = false
    await loadList()
  } catch (e) {
    uni.showToast({ title: e.message || '代录失败', icon: 'none' })
  } finally {
    busy.value = false
  }
}

function defaultValidTo() {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

async function openConvert(row) {
  convertTarget.value = row
  convertForm.value = {
    grantPackage: false,
    totalLessons: '10',
    validFrom: todayYmd(),
    validTo: defaultValidTo(),
  }
  await ensureInterestClasses()
  const idx = interestClasses.value.findIndex(c => c.id === row.class_id)
  convertClassIndex.value = idx >= 0 ? idx : 0
  showConvert.value = true
}

function onConvertClassChange(e) {
  convertClassIndex.value = Number(e.detail.value) || 0
}

async function confirmConvert() {
  if (busy.value || !convertTarget.value?.id) return
  const cls = interestClasses.value[convertClassIndex.value]
  const payload = {}
  if (cls?.id) payload.class_id = cls.id
  if (convertForm.value.grantPackage) {
    const lessons = parseInt(String(convertForm.value.totalLessons), 10)
    if (!lessons || lessons < 1) {
      uni.showToast({ title: '请填写有效课时数', icon: 'none' })
      return
    }
    if (!convertForm.value.validFrom || !convertForm.value.validTo) {
      uni.showToast({ title: '请选择课包有效期', icon: 'none' })
      return
    }
    payload.grant_package = true
    payload.package_total_lessons = lessons
    payload.package_valid_from = convertForm.value.validFrom
    payload.package_valid_to = convertForm.value.validTo
    payload.package_source = 'gift'
  }
  busy.value = true
  try {
    await convertTrialBooking(convertTarget.value.id, payload)
    uni.showToast({ title: '已转正', icon: 'success' })
    showConvert.value = false
    await loadList()
  } catch (e) {
    uni.showToast({ title: e.message || '转正失败', icon: 'none' })
  } finally {
    busy.value = false
  }
}

watch(() => props.pageShowCount, () => { loadList() }, { immediate: true })
</script>

<style lang="scss" scoped>
@import '../../styles/mp-institution.scss';
</style>
