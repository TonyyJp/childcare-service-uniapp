/**
 * 自定义导航栏避让微信小程序右上角胶囊（关闭/更多）。
 * 返回 px 数值，供页面 CSS 变量使用。
 */
export function getNavSafeInsets() {
  const fallback = {
    statusBarPx: 44,
    padTopPx: 88,
    padRightPx: 100,
  }

  try {
    const sys = uni.getSystemInfoSync()
    const statusBar = Number(sys.statusBarHeight) || 20
    const windowWidth = Number(sys.windowWidth) || 375

    let menu = null
    try {
      menu = uni.getMenuButtonBoundingClientRect?.()
    } catch (_) {
      menu = null
    }

    if (!menu || !menu.width || !menu.left) {
      return {
        statusBarPx: statusBar,
        padTopPx: statusBar + 44,
        // 无胶囊信息时预留常见胶囊宽度
        padRightPx: Math.round(windowWidth * 0.28),
      }
    }

    // 顶栏第一行与胶囊垂直对齐
    const padTopPx = Math.max(statusBar, Math.round(menu.top))
    // 右侧内容截止到胶囊左侧，再留 8px 间隙
    const padRightPx = Math.max(12, Math.round(windowWidth - menu.left + 8))

    return {
      statusBarPx: statusBar,
      padTopPx,
      padRightPx,
      capsuleBottomPx: Math.round(menu.bottom),
      capsuleHeightPx: Math.round(menu.height),
    }
  } catch (_) {
    return fallback
  }
}

/** 挂到页面根节点的 CSS 变量 */
export function navSafeCssVars(insets = getNavSafeInsets()) {
  return {
    '--nav-pad-top': `${insets.padTopPx}px`,
    '--nav-pad-right': `${insets.padRightPx}px`,
  }
}
