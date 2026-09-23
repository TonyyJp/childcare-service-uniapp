<template>
  <MealOverlay v-if="innerKey === 'meal'" @back="$emit('back')" />
  <AttendanceOverlay
    v-else-if="innerKey === 'attendance'"
    @back="$emit('back')"
    @go-checkin="$emit('go-checkin', $event)"
  />
  <LeaveOverlay v-else-if="innerKey === 'leave'" @back="$emit('back')" />
  <NoticesOverlay v-else-if="innerKey === 'notices'" @back="$emit('back')" />
  <MessagesOverlay v-else-if="innerKey === 'messages'" @back="$emit('back')" />
  <ScheduleOverlay
    v-else-if="innerKey === 'schedule'"
    @back="$emit('back')"
    @detail="$emit('detail', $event)"
    @lesson-attend="$emit('lesson-attend', $event)"
  />
  <CourseDetailOverlay
    v-else-if="innerKey === 'course-detail'"
    @back="$emit('back')"
    @lesson-attend="$emit('lesson-attend-from-detail')"
  />
  <LessonAttendOverlay v-else-if="innerKey === 'lesson-attend'" @back="$emit('lesson-attend-back')" />
  <GrowthOverlay v-else-if="innerKey === 'life'" @back="$emit('back')" />
  <HostingListOverlay
    v-else-if="innerKey === 'hosting-list'"
    @back="$emit('back')"
    @open="$emit('open-hosting', $event)"
  />
  <HostingDetailOverlay
    v-else-if="innerKey === 'hosting-detail'"
    @back="$emit('back')"
    @homework="$emit('homework', $event)"
    @period-settings="$emit('period-settings')"
  />
  <AttendancePeriodSettingsOverlay
    v-else-if="innerKey === 'attendance-period'"
    @back="$emit('back')"
  />
  <HomeworkTutoringOverlay
    v-else-if="innerKey === 'homework-tutoring'"
    @back="$emit('back')"
  />
</template>

<script setup>
import MealOverlay from './MealOverlay.vue'
import AttendanceOverlay from './AttendanceOverlay.vue'
import LeaveOverlay from './LeaveOverlay.vue'
import NoticesOverlay from './NoticesOverlay.vue'
import MessagesOverlay from './MessagesOverlay.vue'
import ScheduleOverlay from './ScheduleOverlay.vue'
import CourseDetailOverlay from './CourseDetailOverlay.vue'
import LessonAttendOverlay from './LessonAttendOverlay.vue'
import GrowthOverlay from './GrowthOverlay.vue'
import HostingListOverlay from './HostingListOverlay.vue'
import HostingDetailOverlay from './HostingDetailOverlay.vue'
import AttendancePeriodSettingsOverlay from './AttendancePeriodSettingsOverlay.vue'
import HomeworkTutoringOverlay from './HomeworkTutoringOverlay.vue'

defineProps({
  innerKey: { type: String, default: '' },
})
defineEmits([
  'back',
  'go-checkin',
  'detail',
  'lesson-attend',
  'lesson-attend-from-detail',
  'lesson-attend-back',
  'open-hosting',
  'homework',
  'period-settings',
])
</script>
