/**
 * 微信小程序页内「假页」：用 page-container 承接右滑 / 安卓返回，
 * 避免单页应用在内页手势返回时直接退出小程序。
 *
 * 约束：每个页面最多 1 个 page-container（微信官方 tip）。
 */
import { ref, watch } from 'vue'

export const MP_PAGE_CONTAINER_PROPS = {
  position: 'right',
  overlay: true,
  round: false,
  closeOnSlideDown: false,
  customStyle: 'width:100%;height:100%;',
}

/**
 * @param {object} opts
 * @param {() => boolean} opts.isOpen 当前是否应展示内页
 * @param {() => boolean} opts.onBack 执行一层返回；返回 true 表示仍有内页需保持容器打开
 */
export function createPageContainerBridge({ isOpen, onBack }) {
  const show = ref(false)
  const contentAlive = ref(false)

  watch(
    () => isOpen(),
    (open) => {
      if (open) {
        contentAlive.value = true
        show.value = true
      } else if (show.value) {
        // 业务状态已回到壳层（点了左上角返回）：收起容器
        show.value = false
      }
    },
    { immediate: true },
  )

  function onBeforeLeave() {
    // 左上角返回已先改业务状态 → show 变 false 也会进 beforeleave，勿再 pop 一层
    if (!isOpen()) {
      show.value = false
      return
    }
    const stillOpen = onBack()
    if (stillOpen) {
      // 多层内页：取消离开，留在上一层
      show.value = true
      contentAlive.value = true
    } else {
      show.value = false
    }
  }

  function onAfterLeave() {
    if (!isOpen()) contentAlive.value = false
  }

  return { show, contentAlive, onBeforeLeave, onAfterLeave }
}
