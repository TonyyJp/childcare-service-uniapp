<template>
  <view class="overlay-page">
    <view class="gradient-header" style="background:linear-gradient(135deg,#FF7043 0%,#FF8A65 100%);">
      <view style="padding:0 40rpx 32rpx;">
        <view style="display:flex;align-items:center;gap:20rpx;margin-bottom:12rpx;">
          <view class="back-btn" @click="$emit('back')"><text class="back-icon">‹</text></view>
          <view>
            <text style="font-size:40rpx;font-weight:800;color:white;display:block;">成长记录</text>
            <text style="font-size:24rpx;color:rgba(255,255,255,0.8);">记录孩子每一步成长</text>
          </view>
        </view>
        <view style="display:flex;gap:16rpx;">
          <view v-for="t in lifeTabs" :key="t" style="padding:16rpx 32rpx;border-radius:20rpx;font-size:26rpx;font-weight:700;"
            :style="{ backgroundColor: lifeTab === t ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)', color: 'white', border: lifeTab === t ? '2rpx solid rgba(255,255,255,0.6)' : '2rpx solid transparent' }"
            @click="lifeTab = t"><text>{{ t }}</text></view>
        </view>
      </view>
    </view>
    <scroll-view scroll-y style="flex:1;height:0;">
      <view style="padding:24rpx 40rpx;">
        <view v-if="lifeTab === '成长记录'">
          <scroll-view v-if="classes.length > 1" scroll-x style="white-space:nowrap;margin-bottom:16rpx;">
            <view v-for="c in classes" :key="'g-'+c.id" class="pill" style="display:inline-flex;margin-right:12rpx;padding:12rpx 20rpx;"
              :style="{ backgroundColor: growthClassId === c.id ? '#FF7043' : '#F5F0EC', color: growthClassId === c.id ? 'white' : '#8D6E63' }"
              @click="growthClassId = c.id; loadGrowthMilestones()">
              <text style="font-size:24rpx;font-weight:700;">{{ c.name }}</text>
            </view>
          </scroll-view>
          <view v-if="growthLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
          <view v-else-if="!growthRecords.length" style="padding:32rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无里程碑</text></view>
          <view v-for="g in growthRecords" :key="g.id" class="card" style="padding:24rpx;margin-bottom:20rpx;">
            <view style="display:flex;align-items:center;gap:16rpx;margin-bottom:12rpx;">
              <view style="width:48rpx;height:48rpx;border-radius:16rpx;display:flex;align-items:center;justify-content:center;font-size:24rpx;" :style="{ backgroundColor: g.color + '20' }"><text>{{ g.icon }}</text></view>
              <view style="flex:1;">
                <text style="font-size:26rpx;font-weight:700;color:#2D1F18;display:block;">{{ g.student }} · {{ g.type }}</text>
                <text style="font-size:22rpx;color:#8D6E63;">{{ g.date }}</text>
              </view>
              <view class="pill" :style="{ backgroundColor: g.color + '18', color: g.color }"><text style="font-size:22rpx;">{{ g.type }}</text></view>
            </view>
            <text style="font-size:26rpx;color:#2D1F18;line-height:1.7;">{{ g.milestone }}</text>
          </view>
          <view style="padding:20rpx;border-radius:20rpx;border:3rpx dashed #FFCCBC;text-align:center;" @click="openAddGrowth">
            <text style="font-size:26rpx;font-weight:700;color:#FF7043;">+ 记录新里程碑</text>
          </view>
        </view>

        <view v-if="lifeTab === '体格发育'">
          <scroll-view v-if="classes.length > 1" scroll-x style="white-space:nowrap;margin-bottom:16rpx;">
            <view v-for="c in classes" :key="'p-'+c.id" class="pill" style="display:inline-flex;margin-right:12rpx;padding:12rpx 20rpx;"
              :style="{ backgroundColor: growthClassId === c.id ? '#FF7043' : '#F5F0EC', color: growthClassId === c.id ? 'white' : '#8D6E63' }"
              @click="growthClassId = c.id; loadGrowthPhysique()">
              <text style="font-size:24rpx;font-weight:700;">{{ c.name }}</text>
            </view>
          </scroll-view>
          <view v-if="physiqueLoading" style="padding:48rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">加载中…</text></view>
          <view v-else-if="!bodyMeasures.length" style="padding:32rpx 0;text-align:center;"><text style="font-size:26rpx;color:#8D6E63;">暂无学员</text></view>
          <view v-for="b in bodyMeasures" :key="b.student_id || b.name" class="card" style="padding:24rpx;margin-bottom:20rpx;">
            <view style="display:flex;justify-content:space-between;margin-bottom:12rpx;">
              <text style="font-size:28rpx;font-weight:700;color:#2D1F18;">{{ b.name }}</text>
              <text style="font-size:22rpx;color:#8D6E63;">{{ b.date || '未测量' }}</text>
            </view>
            <view v-if="b.metrics.length" style="display:flex;gap:24rpx;">
              <view v-for="m in b.metrics" :key="m.label" style="flex:1;text-align:center;padding:16rpx;background:#FFF8F5;border-radius:16rpx;">
                <text style="font-size:36rpx;font-weight:800;color:#FF7043;display:block;">{{ m.val }}</text>
                <text style="font-size:22rpx;color:#8D6E63;">{{ m.label }}</text>
              </view>
            </view>
            <view v-else style="padding:12rpx 0;"><text style="font-size:24rpx;color:#8D6E63;">尚无体格数据</text></view>
            <view style="margin-top:16rpx;padding:16rpx;border-radius:16rpx;background:#FFF3E0;text-align:center;" @click="openAddPhysique(b)">
              <text style="font-size:24rpx;font-weight:700;color:#E65100;">{{ b.metrics.length ? '更新测量' : '录入身高体重' }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view v-if="showAddGrowth" class="overlay" @click="showAddGrowth = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">记录成长里程碑</text>
        <view style="display:flex;flex-direction:column;gap:20rpx;">
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">学员</text>
            <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
              <view v-for="s in growthStudents" :key="s.id" class="pill"
                :style="{ backgroundColor: newGrowth.studentId === s.id ? '#FF704318' : '#F5F0EC', color: newGrowth.studentId === s.id ? '#FF7043' : '#8D6E63', padding: '12rpx 20rpx' }"
                @click="newGrowth.studentId = s.id">
                <text style="font-size:22rpx;">{{ s.name }}</text>
              </view>
            </view>
          </view>
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">发展领域</text>
            <view style="display:flex;gap:12rpx;flex-wrap:wrap;">
              <view v-for="t in growthTypes" :key="t.type" class="pill" :style="{ backgroundColor: newGrowth.type === t.type ? '#FF704318' : '#F5F0EC', color: newGrowth.type === t.type ? '#FF7043' : '#8D6E63' }" @click="newGrowth.type = t.type">
                <text style="font-size:22rpx;">{{ t.icon }} {{ t.type }}</text>
              </view>
            </view>
          </view>
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">观察描述</text>
            <textarea class="form-input" style="height:120rpx;" :value="newGrowth.milestone" @input="e => newGrowth.milestone = e.detail.value" placeholder="描述孩子的成长表现..." />
          </view>
          <view class="primary-btn" @click="addGrowthRecord">
            <text style="color:white;font-size:30rpx;font-weight:800;">保存里程碑</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showAddPhysique" class="overlay" @click="showAddPhysique = false">
      <view class="sheet" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">录入体格 · {{ newPhysique.name || '学员' }}</text>
        <view style="display:flex;flex-direction:column;gap:20rpx;">
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">身高 (cm)</text>
            <input class="form-input" type="digit" :value="newPhysique.height" @input="e => newPhysique.height = e.detail.value" placeholder="如 132.5" />
          </view>
          <view>
            <text style="font-size:24rpx;font-weight:700;color:#8D6E63;display:block;margin-bottom:8rpx;">体重 (kg)</text>
            <input class="form-input" type="digit" :value="newPhysique.weight" @input="e => newPhysique.weight = e.detail.value" placeholder="如 28.0" />
          </view>
          <view class="primary-btn" @click="savePhysique">
            <text style="color:white;font-size:30rpx;font-weight:800;">保存</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import {
  createGrowthMilestone,
  createGrowthPhysique,
  fetchClassStudents,
  fetchDashboard,
  fetchGrowthMilestones,
  fetchGrowthPhysique,
} from '../../api/teacher.js'

defineEmits(['back'])

const lifeTabs = ['成长记录', '体格发育']
const lifeTab = ref('成长记录')
const showAddGrowth = ref(false)
const showAddPhysique = ref(false)
const growthLoading = ref(false)
const physiqueLoading = ref(false)
const growthBusy = ref(false)
const growthClassId = ref(null)
const growthStudents = ref([])
const growthTypes = [
  { type: '语言', icon: '💬', color: '#3B9EEB' },
  { type: '运动', icon: '🏃', color: '#FF7043' },
  { type: '认知', icon: '🧩', color: '#FFA726' },
  { type: '社交', icon: '🤝', color: '#66BB6A' },
  { type: '艺术', icon: '🎨', color: '#AB47BC' },
]
const newGrowth = ref({ studentId: null, type: '语言', milestone: '' })
const newPhysique = ref({ studentId: null, name: '', height: '', weight: '' })
const growthRecords = ref([])
const bodyMeasures = ref([])
const classes = ref([])

function ensureGrowthClass() {
  if (growthClassId.value && classes.value.some(c => c.id === growthClassId.value)) return
  growthClassId.value =
    classes.value.find(c => c.expected > 0)?.id ||
    classes.value[0]?.id ||
    null
}

async function loadClasses() {
  try {
    const dash = await fetchDashboard()
    classes.value = (dash?.classes || []).map(c => ({
      id: c.id,
      name: c.biz_type === 'care'
        ? `${c.name}·${c.attendance_type_name || '托管'}`
        : `${c.name}·兴趣`,
      expected: c.students_count || (c.periods || []).reduce((s, p) => s + (p.expected || 0), 0),
    }))
  } catch (_) { /* ignore */ }
}

async function loadGrowthStudents() {
  if (!growthClassId.value) {
    growthStudents.value = []
    return
  }
  try {
    const data = await fetchClassStudents(growthClassId.value)
    growthStudents.value = data?.list || []
  } catch {
    growthStudents.value = []
  }
}

async function loadGrowthMilestones() {
  ensureGrowthClass()
  if (!growthClassId.value) {
    growthRecords.value = []
    return
  }
  growthLoading.value = true
  try {
    const data = await fetchGrowthMilestones(growthClassId.value)
    growthRecords.value = data?.list || []
  } catch (e) {
    uni.showToast({ title: e.message || '里程碑加载失败', icon: 'none' })
  } finally {
    growthLoading.value = false
  }
}

async function loadGrowthPhysique() {
  ensureGrowthClass()
  if (!growthClassId.value) {
    bodyMeasures.value = []
    return
  }
  physiqueLoading.value = true
  try {
    const data = await fetchGrowthPhysique(growthClassId.value)
    bodyMeasures.value = (data?.list || []).map(b => ({
      student_id: b.student_id,
      name: b.name,
      date: b.measured_on,
      metrics: b.metrics || [],
    }))
  } catch (e) {
    uni.showToast({ title: e.message || '体格加载失败', icon: 'none' })
  } finally {
    physiqueLoading.value = false
  }
}

async function loadGrowthPage() {
  ensureGrowthClass()
  await loadGrowthStudents()
  if (lifeTab.value === '体格发育') await loadGrowthPhysique()
  else await loadGrowthMilestones()
}

watch(lifeTab, (tab) => {
  if (tab === '体格发育') loadGrowthPhysique()
  else loadGrowthMilestones()
})

async function openAddGrowth() {
  ensureGrowthClass()
  await loadGrowthStudents()
  if (!growthStudents.value.length) {
    uni.showToast({ title: '班级暂无学员', icon: 'none' })
    return
  }
  newGrowth.value = {
    studentId: growthStudents.value[0].id,
    type: '语言',
    milestone: '',
  }
  showAddGrowth.value = true
}

function openAddPhysique(b) {
  newPhysique.value = {
    studentId: b.student_id,
    name: b.name,
    height: b.metrics?.[0]?.val || '',
    weight: b.metrics?.[1]?.val || '',
  }
  showAddPhysique.value = true
}

async function addGrowthRecord() {
  if (!newGrowth.value.studentId) {
    uni.showToast({ title: '请选择学员', icon: 'none' })
    return
  }
  if (!newGrowth.value.milestone.trim()) {
    uni.showToast({ title: '请填写观察描述', icon: 'none' })
    return
  }
  if (growthBusy.value || !growthClassId.value) return
  growthBusy.value = true
  try {
    await createGrowthMilestone({
      class_id: growthClassId.value,
      student_id: newGrowth.value.studentId,
      domain: newGrowth.value.type,
      content: newGrowth.value.milestone.trim(),
    })
    showAddGrowth.value = false
    await loadGrowthMilestones()
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    growthBusy.value = false
  }
}

async function savePhysique() {
  const h = Number(newPhysique.value.height)
  const w = Number(newPhysique.value.weight)
  if (!newPhysique.value.studentId || !growthClassId.value) return
  if (!h || !w) {
    uni.showToast({ title: '请填写身高体重', icon: 'none' })
    return
  }
  if (growthBusy.value) return
  growthBusy.value = true
  try {
    await createGrowthPhysique({
      class_id: growthClassId.value,
      student_id: newPhysique.value.studentId,
      height_cm: h,
      weight_kg: w,
    })
    showAddPhysique.value = false
    await loadGrowthPhysique()
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    growthBusy.value = false
  }
}

onMounted(async () => {
  await loadClasses()
  await loadGrowthPage()
})
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
</style>
