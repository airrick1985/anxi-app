// Material Design Icons 的 SVG 路徑圖示
import { h } from 'vue'

const McIcon = (p) =>
  h('svg', { viewBox: '0 0 24 24', width: p.size || 18, height: p.size || 18, 'aria-hidden': 'true' }, [
    h('path', { d: p.d, fill: 'currentColor' }),
  ])
McIcon.props = ['d', 'size']

export default McIcon
