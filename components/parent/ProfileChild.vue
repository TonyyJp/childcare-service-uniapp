<template>
  <view class="subpage">
    <!-- 顶栏：后续同类页复用 .subpage-nav -->
    <view class="safe-nav-header subpage-nav">
      <text class="subpage-nav__title">我的宝贝</text>
      <view class="subpage-nav__row">
        <view class="subpage-nav__back" @click="goProfilePage('main')">
          <text class="subpage-nav__back-icon">‹</text>
        </view>
        <view class="subpage-nav__side" />
      </view>
    </view>

    <view class="subpage-body">
      <scroll-view scroll-y class="subpage-scroll" :enable-flex="true">
        <view class="subpage-pad">
          <!-- 加载 / 空态 -->
          <view v-if="listLoading" class="empty-block">
            <text class="empty-block__text">加载中…</text>
          </view>
          <view v-else-if="!childList.length" class="empty-block empty-block--card">
            <view class="empty-block__icon-wrap">
              <MpIcon name="users" :size="56" color="#3B9EEB" />
            </view>
            <text class="empty-block__title">还没有宝贝</text>
            <text class="empty-block__hint">向机构索取邀请码后即可添加</text>
            <view class="empty-block__btn" @click="openBindingCompose">
              <text class="empty-block__btn-text">添加宝贝</text>
            </view>
          </view>

          <template v-else>
            <view
              v-for="c in childList"
              :key="c.key"
              class="child-card"
              :class="{
                'child-card--active': c.studentId && c.studentId === activeChildId,
                'child-card--muted': c.status === 'unbound' || c.status === 'rejected',
              }"
              @click="onChildCardClick(c)"
            >
              <view class="child-card__main">
                <view
                  class="child-card__avatar"
                  :style="{ backgroundColor: (c.avatarColor || '#3B9EEB') + '1A' }"
                >
                  <image v-if="c.avatarUrl" class="child-card__avatar-img" :src="c.avatarUrl" mode="aspectFill" />
                  <MpIcon v-else :name="c.icon" :size="48" :color="c.avatarColor || '#3B9EEB'" />
                  <view
                    v-if="c.studentId && c.studentId === activeChildId"
                    class="child-card__avatar-dot"
                  />
                </view>

                <view class="child-card__body">
                  <view class="child-card__name-row">
                    <text class="child-card__name">{{ c.name }}</text>
                    <view class="pill child-card__status" :style="statusStyle(c.status)">
                      <text class="child-card__status-text">{{ statusLabel(c.status) }}</text>
                    </view>
                  </view>

                  <view class="child-card__meta">
                    <text class="child-card__meta-item">{{ c.relationLabel }}</text>
                    <text class="child-card__meta-dot">·</text>
                    <text class="child-card__meta-item child-card__meta-item--ellipsis">{{ c.tenant || '机构未关联' }}</text>
                  </view>
                  <view class="child-card__tags">
                    <view class="child-card__tag">
                      <text class="child-card__tag-text">{{ c.ageText }}</text>
                    </view>
                    <view class="child-card__tag">
                      <text class="child-card__tag-text">{{ c.gradeClassText }}</text>
                    </view>
                    <view v-if="c.school" class="child-card__tag">
                      <text class="child-card__tag-text">{{ c.school }}</text>
                    </view>
                  </view>

                  <view v-if="c.rejectReason" class="child-card__reject">
                    <text class="child-card__reject-text">驳回：{{ c.rejectReason }}</text>
                  </view>
                </view>
              </view>

              <view class="child-card__foot" @click.stop>
                <view
                  v-if="c.editable && c.studentId !== activeChildId"
                  class="child-card__foot-btn"
                  @click="switchCurrent(c)"
                >
                  <text class="child-card__foot-btn-text">设为当前</text>
                </view>
                <view
                  v-else-if="c.editable && c.studentId === activeChildId"
                  class="child-card__foot-btn child-card__foot-btn--ghost"
                >
                  <text class="child-card__foot-btn-text child-card__foot-btn-text--muted">当前查看</text>
                </view>
                <view v-if="c.editable" class="child-card__foot-btn child-card__foot-btn--primary" @click="openEditChild(c)">
                  <text class="child-card__foot-btn-text child-card__foot-btn-text--primary">编辑资料</text>
                </view>
                <view v-else-if="c.status === 'pending'" class="child-card__foot-hint">
                  <text class="child-card__foot-hint-text">审核中，暂不可编辑</text>
                </view>
              </view>
            </view>

            <view class="add-dashed" @click="openBindingCompose">
              <MpIcon name="plus" :size="28" color="#3B9EEB" />
              <text class="add-dashed__text">添加宝贝</text>
            </view>
            <text class="add-hint">请向机构索取邀请码添加宝贝</text>
          </template>
        </view>
      </scroll-view>
    </view>

    <!-- 编辑已绑定孩子 -->
    <view v-if="showEditChild" class="overlay" style="z-index:80;" @click="closeEditChild">
      <view class="sheet sheet--form" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">编辑宝贝资料</text>
        <scroll-view scroll-y class="sheet-scroll">
          <view class="form-stack">
            <view class="form-avatar-block">
              <button
                class="child-avatar-btn"
                hover-class="none"
                open-type="chooseAvatar"
                :disabled="editBusy"
                @chooseavatar="onEditChooseWxAvatar"
                @click="pickEditAvatarFallback"
              >
                <image v-if="editAvatarPreview" class="child-avatar-btn__img" :src="editAvatarPreview" mode="aspectFill" />
                <MpIcon
                  v-else
                  :name="editForm.gender ? childAvatarIcon(editForm.gender) : 'circle-user-round'"
                  :size="64"
                  :color="editForm.gender ? childAvatarColor(editForm.gender) : '#6B7280'"
                />
                <view class="child-avatar-btn__badge"><text class="child-avatar-btn__badge-text">✎</text></view>
              </button>
              <text class="form-avatar-hint">头像选填，可使用微信头像</text>
            </view>

            <view class="form-section">
              <text class="form-section__title">基础信息</text>
              <view class="form-field">
                <text class="form-label">与孩子关系</text>
                <picker mode="selector" :range="bindingRelations" range-key="label" :value="editRelationIndex" @change="onEditRelationPick">
                  <view class="form-input form-input--picker">
                    <text :class="editForm.relation ? 'form-value' : 'form-placeholder'">{{ editRelationLabel }}</text>
                    <text class="form-caret">▼</text>
                  </view>
                </picker>
              </view>
              <view class="form-field">
                <text class="form-label">孩子姓名 <text class="req">*</text></text>
                <input class="form-input" :value="editForm.childName" @input="e => editForm.childName = e.detail.value" placeholder="孩子姓名" maxlength="20" />
              </view>
              <view class="form-field">
                <text class="form-label">性别 <text class="req">*</text></text>
                <view class="seg">
                  <view
                    v-for="g in genderOptions"
                    :key="g.value"
                    class="seg__item"
                    :class="{ 'seg__item--on': editForm.gender === g.value }"
                    @click="editForm.gender = g.value"
                  >
                    <text class="seg__text" :class="{ 'seg__text--on': editForm.gender === g.value }">{{ g.label }}</text>
                  </view>
                </view>
              </view>
              <view class="form-field">
                <text class="form-label">出生日期 <text class="req">*</text></text>
                <picker mode="date" :value="editForm.birthDate || '2018-01-01'" :end="todayStr" @change="onEditBirthPick">
                  <view class="form-input form-input--picker">
                    <text :class="editForm.birthDate ? 'form-value' : 'form-placeholder'">{{ editForm.birthDate || '请选择' }}</text>
                    <text class="form-caret">▼</text>
                  </view>
                </picker>
              </view>
              <view class="form-field">
                <text class="form-label">年龄</text>
                <input class="form-input" type="number" :value="editForm.age" disabled placeholder="根据出生日期自动计算" />
              </view>
            </view>

            <view class="form-section">
              <text class="form-section__title">就读信息</text>
              <view class="form-field">
                <text class="form-label">就读学校</text>
                <input class="form-input" :value="editForm.school" @input="e => editForm.school = e.detail.value" placeholder="就读学校（选填）" maxlength="50" />
              </view>
              <view class="form-row">
                <view class="form-field form-field--half">
                  <text class="form-label">年级 <text class="req">*</text></text>
                  <picker mode="selector" :range="gradeOptions" range-key="label" :value="editGradeIndex" @change="onEditGradePick">
                    <view class="form-input form-input--picker">
                      <text class="form-ellipsis" :class="editForm.gradeLevel ? 'form-value' : 'form-placeholder'">{{ editGradeLabel }}</text>
                      <text class="form-caret">▼</text>
                    </view>
                  </picker>
                </view>
                <view class="form-field form-field--half">
                  <text class="form-label">班级 <text class="req">*</text></text>
                  <picker mode="selector" :range="schoolClassOptions" range-key="label" :value="editSchoolClassIndex" @change="onEditSchoolClassPick">
                    <view class="form-input form-input--picker">
                      <text class="form-ellipsis" :class="editForm.className ? 'form-value' : 'form-placeholder'">{{ editSchoolClassLabel }}</text>
                      <text class="form-caret">▼</text>
                    </view>
                  </picker>
                </view>
              </view>
            </view>

            <view class="primary-btn" :style="{ opacity: editBusy ? 0.6 : 1 }" @click="submitEditChild">
              <text class="primary-btn__text">保存</text>
            </view>
            <view
              v-if="editingChildId && editingChildId !== activeChildId"
              class="secondary-btn"
              @click="setAsCurrent"
            >
              <text class="secondary-btn__text">设为当前查看</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 添加宝贝 -->
    <view v-if="showBindingCompose" class="overlay" style="z-index:80;" @click="closeBindingCompose">
      <view class="sheet sheet--form" @click.stop>
        <view class="sheet-handle" />
        <text class="sheet-title">添加宝贝</text>
        <scroll-view scroll-y class="sheet-scroll">
          <view class="form-stack">
            <view class="form-section">
              <text class="form-section__title">邀请码</text>
              <view class="form-field">
                <text class="form-label">邀请码 <text class="req">*</text></text>
                <view class="invite-row">
                  <input
                    class="form-input invite-row__input"
                    :value="bindingForm.inviteCode"
                    @input="e => bindingForm.inviteCode = (e.detail.value || '').toUpperCase()"
                    maxlength="6"
                    placeholder="6 位邀请码"
                  />
                  <view class="invite-row__btn" @click="previewInvite">
                    <text class="invite-row__btn-text">查询</text>
                  </view>
                </view>
              </view>
              <view v-if="bindingInviteInfo" class="invite-card">
                <text class="invite-card__name">{{ bindingInviteInfo.tenant?.name }}</text>
                <text v-if="bindingInviteInfo.tenant?.address" class="invite-card__addr">{{ bindingInviteInfo.tenant.address }}</text>
              </view>
            </view>

            <view class="form-section">
              <text class="form-section__title">基础信息</text>
              <view class="form-field">
                <text class="form-label">与孩子关系 <text class="req">*</text></text>
                <picker mode="selector" :range="bindingRelations" range-key="label" :value="relationIndex" @change="onRelationPick">
                  <view class="form-input form-input--picker">
                    <text :class="bindingForm.relation ? 'form-value' : 'form-placeholder'">{{ relationPickerLabel }}</text>
                    <text class="form-caret">▼</text>
                  </view>
                </picker>
              </view>
              <view class="form-field">
                <text class="form-label">孩子姓名 <text class="req">*</text></text>
                <input class="form-input" :value="bindingForm.childName" @input="e => bindingForm.childName = e.detail.value" placeholder="孩子姓名" maxlength="20" />
              </view>
              <view class="form-field">
                <text class="form-label">性别 <text class="req">*</text></text>
                <view class="seg">
                  <view
                    v-for="g in genderOptions"
                    :key="'b-' + g.value"
                    class="seg__item"
                    :class="{ 'seg__item--on': bindingForm.gender === g.value }"
                    @click="bindingForm.gender = g.value"
                  >
                    <text class="seg__text" :class="{ 'seg__text--on': bindingForm.gender === g.value }">{{ g.label }}</text>
                  </view>
                </view>
              </view>
              <view class="form-field">
                <text class="form-label">出生日期 <text class="req">*</text></text>
                <picker mode="date" :value="bindingForm.birthDate || '2018-01-01'" :end="todayStr" @change="onBirthPick">
                  <view class="form-input form-input--picker">
                    <text :class="bindingForm.birthDate ? 'form-value' : 'form-placeholder'">{{ bindingForm.birthDate || '请选择' }}</text>
                    <text class="form-caret">▼</text>
                  </view>
                </picker>
              </view>
              <view class="form-field">
                <text class="form-label">年龄</text>
                <input class="form-input" type="number" :value="bindingForm.age" disabled placeholder="根据出生日期自动计算" />
              </view>
            </view>

            <view class="form-section">
              <text class="form-section__title">就读信息</text>
              <view class="form-field">
                <text class="form-label">就读学校</text>
                <input class="form-input" :value="bindingForm.school" @input="e => bindingForm.school = e.detail.value" placeholder="就读学校（选填）" maxlength="50" />
              </view>
              <view class="form-row">
                <view class="form-field form-field--half">
                  <text class="form-label">年级 <text class="req">*</text></text>
                  <picker mode="selector" :range="gradeOptions" range-key="label" :value="gradeIndex" @change="onGradePick">
                    <view class="form-input form-input--picker">
                      <text class="form-ellipsis" :class="bindingForm.gradeLevel ? 'form-value' : 'form-placeholder'">{{ gradePickerLabel }}</text>
                      <text class="form-caret">▼</text>
                    </view>
                  </picker>
                </view>
                <view class="form-field form-field--half">
                  <text class="form-label">班级 <text class="req">*</text></text>
                  <picker mode="selector" :range="schoolClassOptions" range-key="label" :value="schoolClassIndex" @change="onSchoolClassPick">
                    <view class="form-input form-input--picker">
                      <text class="form-ellipsis" :class="bindingForm.className ? 'form-value' : 'form-placeholder'">{{ schoolClassPickerLabel }}</text>
                      <text class="form-caret">▼</text>
                    </view>
                  </picker>
                </view>
              </view>
            </view>

            <view class="primary-btn" :style="{ opacity: bindingBusy ? 0.6 : 1 }" @click="submitBinding">
              <text class="primary-btn__text">提交绑定申请</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, inject, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { fetchDicts } from '../../api/common.js'
import { createBinding, fetchInviteInfo, fetchStudents, updateStudent } from '../../api/parent.js'
import { mediaUrl } from '../../config.js'
import { uploadFile } from '../../utils/request.js'
import { childAvatarColor, childAvatarIcon, PARENT_CTX_KEY } from './parentContext.js'
import MpIcon from '../MpIcon.vue'

const props = defineProps({ active: { type: Boolean, default: false } })
const ctx = inject(PARENT_CTX_KEY)
const { activeChildId, goProfilePage, selectChild, loadParentHome, consumeOpenBindingCompose } = ctx

const listLoading = ref(false)
const childList = ref([])
const showBindingCompose = ref(false)
const bindingBusy = ref(false)
const bindingPreviewBusy = ref(false)
const bindingInviteInfo = ref(null)

const showEditChild = ref(false)
const editBusy = ref(false)
const editingChildId = ref(null)
const editAvatarLocal = ref('')
const editAvatarAttachmentId = ref(null)

const bindingRelations = ref([])
const genderOptions = ref([])
const gradeOptions = ref([])
const schoolClassOptions = ref([])

const emptyForm = () => ({
  inviteCode: '',
  relation: '',
  childName: '',
  gender: '',
  birthDate: '',
  age: '',
  school: '',
  gradeLevel: '',
  className: '',
})
const bindingForm = ref(emptyForm())
const editForm = ref(emptyForm())

const todayStr = computed(() => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
})

const editAvatarPreview = computed(() => editAvatarLocal.value || editForm.value.avatarUrl || '')

function optionIndex(options, value) {
  if (!value) return 0
  const i = options.findIndex(o => o.value === value)
  return i >= 0 ? i : 0
}
function optionLabel(options, value, placeholder) {
  const hit = options.find(o => o.value === value)
  return hit?.label || placeholder
}

const relationIndex = computed(() => optionIndex(bindingRelations.value, bindingForm.value.relation))
const gradeIndex = computed(() => optionIndex(gradeOptions.value, bindingForm.value.gradeLevel))
const schoolClassIndex = computed(() => optionIndex(schoolClassOptions.value, bindingForm.value.className))
const relationPickerLabel = computed(() => optionLabel(bindingRelations.value, bindingForm.value.relation, '请选择'))
const gradePickerLabel = computed(() => optionLabel(gradeOptions.value, bindingForm.value.gradeLevel, '请选择'))
const schoolClassPickerLabel = computed(() => optionLabel(schoolClassOptions.value, bindingForm.value.className, '请选择'))

const editRelationIndex = computed(() => optionIndex(bindingRelations.value, editForm.value.relation))
const editGradeIndex = computed(() => optionIndex(gradeOptions.value, editForm.value.gradeLevel))
const editSchoolClassIndex = computed(() => optionIndex(schoolClassOptions.value, editForm.value.className))
const editRelationLabel = computed(() => optionLabel(bindingRelations.value, editForm.value.relation, '请选择'))
const editGradeLabel = computed(() => optionLabel(gradeOptions.value, editForm.value.gradeLevel, '请选择'))
const editSchoolClassLabel = computed(() => optionLabel(schoolClassOptions.value, editForm.value.className, '请选择'))

function defaultRelation() {
  return bindingRelations.value[0]?.value || 'father'
}

function ageFromBirth(dateStr) {
  if (!dateStr) return ''
  const d = new Date(String(dateStr).replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1
  return age >= 0 ? String(age) : ''
}

function statusLabel(s) {
  return ({ pending: '待审核', approved: '已绑定', unbound: '已解绑', rejected: '已驳回' })[s] || s
}
function statusStyle(s) {
  const map = {
    pending: { backgroundColor: '#FFF3E0', color: '#E65100' },
    approved: { backgroundColor: '#E8F5E9', color: '#2E7D32' },
    unbound: { backgroundColor: '#F5F5F5', color: '#757575' },
    rejected: { backgroundColor: '#FFEBEE', color: '#C62828' },
  }
  return map[s] || map.pending
}

function onRelationPick(e) {
  bindingForm.value.relation = bindingRelations.value[Number(e.detail.value)]?.value || ''
}
function onGradePick(e) {
  bindingForm.value.gradeLevel = gradeOptions.value[Number(e.detail.value)]?.value || ''
}
function onSchoolClassPick(e) {
  bindingForm.value.className = schoolClassOptions.value[Number(e.detail.value)]?.value || ''
}
function onBirthPick(e) {
  bindingForm.value.birthDate = e.detail.value || ''
  bindingForm.value.age = ageFromBirth(bindingForm.value.birthDate)
}
function onEditRelationPick(e) {
  editForm.value.relation = bindingRelations.value[Number(e.detail.value)]?.value || ''
}
function onEditGradePick(e) {
  editForm.value.gradeLevel = gradeOptions.value[Number(e.detail.value)]?.value || ''
}
function onEditSchoolClassPick(e) {
  editForm.value.className = schoolClassOptions.value[Number(e.detail.value)]?.value || ''
}
function onEditBirthPick(e) {
  editForm.value.birthDate = e.detail.value || ''
  editForm.value.age = ageFromBirth(editForm.value.birthDate)
}

function tryOpenBindingFromHome() {
  if (consumeOpenBindingCompose?.()) openBindingCompose()
}

async function loadDictMap(type) {
  try {
    const data = await fetchDicts(type)
    return (data?.list || []).map(d => ({ label: d.label, value: d.value }))
  } catch {
    return []
  }
}

async function loadFormDicts() {
  const [relation, gender, grade, schoolClass] = await Promise.all([
    loadDictMap('relation'),
    loadDictMap('gender'),
    loadDictMap('grade_level'),
    loadDictMap('school_class'),
  ])
  bindingRelations.value = relation
  genderOptions.value = gender
  gradeOptions.value = grade
  schoolClassOptions.value = schoolClass
}

function mapListItem(row) {
  const s = row.student || {}
  const gender = s.gender || 'unknown'
  const status = row.binding_status || row.status
  const editable = status === 'approved' && !!s.id
  const gradeLabel = optionLabel(gradeOptions.value, s.grade_level, '')
  const classLabel = optionLabel(schoolClassOptions.value, s.class_name, '')
  const gradeClassText = [gradeLabel, classLabel].filter(Boolean).join('') || '年级班级未填'
  const age = s.age != null && s.age !== '' ? s.age : ageFromBirth(s.birth_date)
  return {
    key: row.binding_id || `${status}-${s.name}-${row.applied_at}`,
    bindingId: row.binding_id,
    studentId: s.id || null,
    status,
    editable,
    name: s.name || '孩子',
    tenant: row.tenant?.name || '',
    relation: row.relation || '',
    relationLabel: optionLabel(bindingRelations.value, row.relation, row.relation || '家长'),
    school: s.school || '',
    ageText: age !== '' && age != null ? `${age}岁` : '年龄未填',
    gradeClassText,
    rejectReason: row.reject_reason || '',
    gender,
    icon: childAvatarIcon(gender),
    avatarColor: childAvatarColor(gender),
    avatarUrl: mediaUrl(s.avatar || ''),
    birthDate: s.birth_date || '',
    gradeLevel: s.grade_level || '',
    className: s.class_name || '',
  }
}

async function loadChildList() {
  listLoading.value = true
  try {
    const data = await fetchStudents()
    childList.value = (data?.list || []).map(mapListItem)
  } catch {
    childList.value = []
  } finally {
    listLoading.value = false
  }
}

function openBindingCompose() {
  bindingForm.value = {
    ...emptyForm(),
    relation: defaultRelation(),
    gender: '',
  }
  bindingInviteInfo.value = null
  showBindingCompose.value = true
}
function closeBindingCompose() {
  showBindingCompose.value = false
  bindingInviteInfo.value = null
}

function onChildCardClick(c) {
  if (!c.editable) {
    if (c.status === 'pending') {
      uni.showToast({ title: '待审核，暂不可编辑', icon: 'none' })
    }
    return
  }
  openEditChild(c)
}

async function switchCurrent(c) {
  if (!c?.studentId) return
  await selectChild(c.studentId)
  uni.showToast({ title: '已切换', icon: 'success' })
}

function openEditChild(c) {
  editingChildId.value = c.studentId
  editAvatarLocal.value = ''
  editAvatarAttachmentId.value = null
  editForm.value = {
    ...emptyForm(),
    relation: c.relation || defaultRelation(),
    childName: c.name || '',
    gender: c.gender || '',
    birthDate: c.birthDate || '',
    age: ageFromBirth(c.birthDate),
    school: c.school || '',
    gradeLevel: c.gradeLevel || '',
    className: c.className || '',
    avatarUrl: c.avatarUrl || '',
  }
  showEditChild.value = true
}
function closeEditChild() {
  showEditChild.value = false
  editingChildId.value = null
  editAvatarLocal.value = ''
  editAvatarAttachmentId.value = null
}

async function setAsCurrent() {
  if (!editingChildId.value) return
  await selectChild(editingChildId.value)
  uni.showToast({ title: '已切换', icon: 'success' })
}

async function applyEditAvatarFile(filePath) {
  if (!filePath || editBusy.value) return
  editBusy.value = true
  try {
    const up = await uploadFile(filePath, 'avatar')
    editAvatarAttachmentId.value = up.attachment_id
    editAvatarLocal.value = up.url ? mediaUrl(up.url) : filePath
    uni.showToast({ title: '头像已选择', icon: 'success' })
  } catch (e) {
    uni.showToast({ title: e.message || '头像上传失败', icon: 'none' })
  } finally {
    editBusy.value = false
  }
}

function onEditChooseWxAvatar(e) {
  const url = e?.detail?.avatarUrl
  if (url) applyEditAvatarFile(url)
}

function pickEditAvatarFallback() {
  if (uni.canIUse && uni.canIUse('button.open-type.chooseAvatar')) return
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const path = res.tempFilePaths?.[0]
      if (path) applyEditAvatarFile(path)
    },
  })
}

function validateChildForm(form, { needRelation = true } = {}) {
  if (needRelation && !form.relation) return '请选择与孩子关系'
  if (!(form.childName || '').trim()) return '请填写孩子姓名'
  if (!form.gender) return '请选择性别'
  if (!form.birthDate) return '请选择出生日期'
  if (!form.gradeLevel) return '请选择年级'
  if (!form.className) return '请选择班级'
  return ''
}

async function submitEditChild() {
  const err = validateChildForm(editForm.value)
  if (err) {
    uni.showToast({ title: err, icon: 'none' })
    return
  }
  if (!editingChildId.value || editBusy.value) return
  editBusy.value = true
  try {
    const payload = {
      name: (editForm.value.childName || '').trim(),
      gender: editForm.value.gender,
      birth_date: editForm.value.birthDate,
      school: (editForm.value.school || '').trim() || undefined,
      grade_level: editForm.value.gradeLevel,
      class_name: editForm.value.className,
      relation: editForm.value.relation,
    }
    if (editAvatarAttachmentId.value) {
      payload.avatar_attachment_id = editAvatarAttachmentId.value
    }
    await updateStudent(editingChildId.value, payload)
    uni.showToast({ title: '已保存', icon: 'success' })
    closeEditChild()
    await loadParentHome()
    await loadChildList()
  } catch (e) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  } finally {
    editBusy.value = false
  }
}

async function previewInvite() {
  const code = (bindingForm.value.inviteCode || '').trim()
  if (code.length !== 6) {
    uni.showToast({ title: '请输入邀请码', icon: 'none' })
    return
  }
  if (bindingPreviewBusy.value) return
  bindingPreviewBusy.value = true
  try {
    bindingInviteInfo.value = await fetchInviteInfo(code)
  } catch (e) {
    bindingInviteInfo.value = null
    uni.showToast({ title: e.message || '邀请码无效', icon: 'none' })
  } finally {
    bindingPreviewBusy.value = false
  }
}

async function submitBinding() {
  const code = (bindingForm.value.inviteCode || '').trim()
  if (code.length !== 6) {
    uni.showToast({ title: '请输入邀请码', icon: 'none' })
    return
  }
  const err = validateChildForm(bindingForm.value)
  if (err) {
    uni.showToast({ title: err, icon: 'none' })
    return
  }
  if (bindingBusy.value) return
  bindingBusy.value = true
  try {
    if (!bindingInviteInfo.value) bindingInviteInfo.value = await fetchInviteInfo(code)
    const ageNum = bindingForm.value.age !== '' && bindingForm.value.age != null
      ? Number(bindingForm.value.age)
      : undefined
    await createBinding({
      invite_code: code,
      relation: bindingForm.value.relation,
      child: {
        name: (bindingForm.value.childName || '').trim(),
        gender: bindingForm.value.gender,
        birth_date: bindingForm.value.birthDate,
        age: Number.isFinite(ageNum) ? ageNum : undefined,
        school: (bindingForm.value.school || '').trim() || undefined,
        grade_level: bindingForm.value.gradeLevel,
        class_name: bindingForm.value.className,
      },
    })
    uni.showToast({ title: '已提交，待机构审核', icon: 'success' })
    closeBindingCompose()
    await loadChildList()
    await loadParentHome()
  } catch (e) {
    uni.showToast({ title: e.message || '提交失败', icon: 'none' })
  } finally {
    bindingBusy.value = false
  }
}

async function refreshPage() {
  await loadFormDicts()
  await loadChildList()
  tryOpenBindingFromHome()
}

watch(() => props.active, async (v) => { if (v) await refreshPage() }, { immediate: true })
onShow(async () => { if (props.active) await refreshPage() })
</script>

<style lang="scss">
@import '../../styles/mp-common.scss';
@import '../../styles/profile-subpage.scss';
@import '../../styles/profile-subpage.scss';

/* —— 我的宝贝专属 —— */
$accent: #3b9eeb;
$accent-soft: #e3f2fd;
$ink: #1f2937;
$muted: #6b7280;
$line: #e3f2fd;

.child-card {
  background: #fff;
  border-radius: 28rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 16rpx rgba(31, 41, 55, 0.06);
  border: 2rpx solid transparent;
}

.child-card--active {
  border-color: rgba(59, 158, 235, 0.4);
  box-shadow: 0 8rpx 28rpx rgba(59, 158, 235, 0.12);
}

.child-card--muted {
  opacity: 0.88;
}

.child-card__main {
  display: flex;
  align-items: flex-start;
}

.child-card__avatar {
  position: relative;
  width: 108rpx;
  height: 108rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 22rpx;
  overflow: hidden;
}

.child-card__avatar-img {
  width: 108rpx;
  height: 108rpx;
}

.child-card__avatar-dot {
  position: absolute;
  right: 8rpx;
  bottom: 8rpx;
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: $accent;
  border: 4rpx solid #fff;
}

.child-card__body {
  flex: 1;
  min-width: 0;
}

.child-card__name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.child-card__name {
  font-size: 32rpx;
  font-weight: 800;
  color: $ink;
}

.child-card__status-text {
  font-size: 20rpx;
  font-weight: 700;
}

.child-card__meta {
  display: flex;
  align-items: center;
  min-width: 0;
  margin-bottom: 12rpx;
}

.child-card__meta-item {
  font-size: 22rpx;
  color: $muted;
  flex-shrink: 0;
}

.child-card__meta-item--ellipsis {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.child-card__meta-dot {
  font-size: 22rpx;
  color: #cbb8c4;
  margin: 0 8rpx;
  flex-shrink: 0;
}

.child-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.child-card__tag {
  padding: 6rpx 14rpx;
  border-radius: 12rpx;
  background: #f5f7fa;
}

.child-card__tag-text {
  font-size: 20rpx;
  color: #5a7a96;
  font-weight: 600;
}

.child-card__reject {
  margin-top: 14rpx;
  padding: 12rpx 16rpx;
  border-radius: 14rpx;
  background: #fff5f5;
}

.child-card__reject-text {
  font-size: 22rpx;
  color: #c62828;
  line-height: 1.4;
}

.child-card__foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12rpx;
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid $line;
}

.child-card__foot-btn {
  padding: 12rpx 22rpx;
  border-radius: 16rpx;
  background: $accent-soft;
}

.child-card__foot-btn--ghost {
  background: transparent;
}

.child-card__foot-btn--primary {
  background: linear-gradient(135deg, #3b9eeb 0%, #64b5f6 100%);
}

.child-card__foot-btn-text {
  font-size: 22rpx;
  font-weight: 700;
  color: $accent;
}

.child-card__foot-btn-text--muted {
  color: $muted;
  font-weight: 600;
}

.child-card__foot-btn-text--primary {
  color: #fff;
}

.child-card__foot-hint-text {
  font-size: 22rpx;
  color: #9ca3af;
}

.empty-block__icon-wrap {
  width: 112rpx;
  height: 112rpx;
  border-radius: 36rpx;
  background: $accent-soft;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24rpx;
}

.empty-block__btn {
  margin: 32rpx auto 0;
  padding: 20rpx 48rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #3b9eeb 0%, #64b5f6 100%);
  display: inline-flex;
}

.empty-block__btn-text {
  font-size: 28rpx;
  font-weight: 800;
  color: #fff;
}

.sheet--form {
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom, 0px));
}

.sheet-scroll {
  max-height: 68vh;
}

.form-stack {
  display: flex;
  flex-direction: column;
  padding-bottom: 24rpx;
}

.form-avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28rpx;
}

.form-avatar-hint {
  font-size: 22rpx;
  color: $muted;
  margin-top: 12rpx;
}

.form-field--half {
  flex: 1;
  min-width: 0;
}

.form-row {
  display: flex;
  gap: 16rpx;
}

.req {
  color: #e53935;
}

.form-input--picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-value {
  color: $ink;
  font-size: 26rpx;
}

.form-placeholder {
  color: #9ca3af;
  font-size: 26rpx;
}

.form-caret {
  color: $muted;
  font-size: 22rpx;
  flex-shrink: 0;
  margin-left: 8rpx;
}

.form-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.seg {
  display: flex;
  gap: 12rpx;
}

.seg__item {
  flex: 1;
  padding: 18rpx 12rpx;
  border-radius: 18rpx;
  background: #fff;
  border: 2rpx solid #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seg__item--on {
  border-color: $accent;
  background: $accent-soft;
}

.seg__text {
  font-size: 26rpx;
  color: $muted;
  font-weight: 600;
}

.seg__text--on {
  color: $accent;
  font-weight: 800;
}

.invite-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.invite-row__input {
  flex: 1;
}

.invite-row__btn {
  padding: 0 28rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: $accent-soft;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.invite-row__btn-text {
  font-size: 26rpx;
  font-weight: 700;
  color: $accent;
}

.invite-card {
  padding: 20rpx;
  border-radius: 18rpx;
  background: #fff;
  border: 1rpx solid $line;
  margin-bottom: 16rpx;
}

.invite-card__name {
  font-size: 28rpx;
  font-weight: 800;
  color: $ink;
  display: block;
}

.invite-card__addr {
  font-size: 24rpx;
  color: $muted;
  display: block;
  margin-top: 6rpx;
}

.primary-btn__text {
  color: #fff;
  font-size: 30rpx;
  font-weight: 800;
}

.secondary-btn {
  margin-top: 16rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: $accent-soft;
  text-align: center;
}

.secondary-btn__text {
  font-size: 28rpx;
  font-weight: 700;
  color: $accent;
}

.child-avatar-btn {
  position: relative;
  width: 140rpx;
  height: 140rpx;
  padding: 0;
  margin: 0;
  border-radius: 40rpx;
  background: $accent-soft;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: none;
  line-height: 1;
}
.child-avatar-btn::after {
  border: none;
}
.child-avatar-btn__img {
  width: 140rpx;
  height: 140rpx;
}
.child-avatar-btn__badge {
  position: absolute;
  right: 8rpx;
  bottom: 8rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 20rpx;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}
.child-avatar-btn__badge-text {
  font-size: 20rpx;
  color: white;
}
</style>
