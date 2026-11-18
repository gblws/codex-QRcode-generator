import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'
import './styles.css'

const state = {
  mode: 'qr',
  value: 'https://codex.com',
  foreground: '#17191c',
  background: '#ffffff',
  icon: null,
  iconName: ''
}

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="shell">
    <header class="topbar">
      <div class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="brand-name">Code Stamp</div>
    </header>

    <section class="workspace">
      <div class="control-panel">
        <div class="mode-switch" role="tablist" aria-label="码制">
          <button class="mode-button is-active" data-mode="qr" role="tab" aria-selected="true">二维码</button>
          <button class="mode-button" data-mode="barcode" role="tab" aria-selected="false">条形码</button>
        </div>

        <label class="field-label" for="content">内容</label>
        <textarea id="content" rows="5" spellcheck="false">${state.value}</textarea>

        <div class="control-row">
          <div class="control-block">
            <label class="field-label" for="foreground">前景色</label>
            <label class="color-input"><input id="foreground" type="color" value="${state.foreground}" /><span id="foreground-value">${state.foreground}</span></label>
          </div>
          <div class="control-block">
            <label class="field-label" for="background">背景色</label>
            <label class="color-input"><input id="background" type="color" value="${state.background}" /><span id="background-value">${state.background}</span></label>
          </div>
        </div>

        <div class="icon-line">
          <div>
            <div class="field-label">中心图标</div>
            <div class="icon-name" id="icon-name">未选择</div>
          </div>
          <div class="icon-actions">
            <button class="icon-clear-button" id="clear-icon" type="button" aria-label="取消中心图标" title="取消中心图标" disabled>×</button>
            <label class="upload-button" for="icon-input">选择图标</label>
          </div>
          <input id="icon-input" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden />
        </div>

        <button class="download-button" id="download-button" type="button">
          <span class="download-icon" aria-hidden="true">↓</span>
          下载 PNG
        </button>
      </div>

      <div class="preview-panel">
        <div class="preview-stage" id="preview-stage">
          <canvas id="qr-canvas" width="720" height="720"></canvas>
          <svg id="barcode-svg" xmlns="http://www.w3.org/2000/svg" aria-label="条形码"></svg>
        </div>
      </div>
    </section>
  </div>
`

const content = document.querySelector('#content')
const qrCanvas = document.querySelector('#qr-canvas')
const barcodeSvg = document.querySelector('#barcode-svg')
const clearIcon = document.querySelector('#clear-icon')

function updateColorLabel(id, value) {
  document.querySelector(`#${id}-value`).textContent = value.toUpperCase()
}

function drawIcon(canvas) {
  if (!state.icon) return
  const context = canvas.getContext('2d')
  const size = canvas.width * 0.22
  const x = (canvas.width - size) / 2
  const y = (canvas.height - size) / 2
  context.fillStyle = state.background
  context.beginPath()
  context.roundRect(x - 14, y - 14, size + 28, size + 28, 20)
  context.fill()
  context.drawImage(state.icon, x, y, size, size)
}

async function renderQr() {
  qrCanvas.hidden = false
  barcodeSvg.hidden = true
  await QRCode.toCanvas(qrCanvas, state.value || ' ', {
    width: 720,
    margin: 3,
    color: { dark: state.foreground, light: state.background },
    errorCorrectionLevel: 'H'
  })
  drawIcon(qrCanvas)
}

function renderBarcode() {
  qrCanvas.hidden = true
  barcodeSvg.hidden = false
  JsBarcode(barcodeSvg, state.value || ' ', {
    format: 'CODE128',
    lineColor: state.foreground,
    background: state.background,
    width: 3,
    height: 240,
    displayValue: true,
    font: 'IBM Plex Mono',
    fontSize: 26,
    margin: 34,
    textMargin: 12
  })
}

async function render() {
  if (state.mode === 'qr') await renderQr()
  else renderBarcode()
}

async function downloadQr() {
  const link = document.createElement('a')
  link.download = `code-stamp-${state.mode}.png`
  link.href = state.mode === 'qr' ? qrCanvas.toDataURL('image/png') : await svgToPng()
  link.click()
}

function svgToPng() {
  const svg = new XMLSerializer().serializeToString(barcodeSvg)
  return new Promise((resolve) => {
    const image = new Image()
    const canvas = document.createElement('canvas')
    canvas.width = 900
    canvas.height = 450
    const context = canvas.getContext('2d')
    image.onload = () => {
      context.fillStyle = state.background
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 30, 45, 840, 360)
      resolve(canvas.toDataURL('image/png'))
    }
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
}

document.querySelectorAll('.mode-button').forEach((button) => {
  button.addEventListener('click', () => {
    state.mode = button.dataset.mode
    document.querySelectorAll('.mode-button').forEach((item) => {
      const active = item === button
      item.classList.toggle('is-active', active)
      item.setAttribute('aria-selected', active)
    })
    render()
  })
})

content.addEventListener('input', () => {
  state.value = content.value
  render()
})

document.querySelector('#foreground').addEventListener('input', (event) => {
  state.foreground = event.target.value
  updateColorLabel('foreground', state.foreground)
  render()
})

document.querySelector('#background').addEventListener('input', (event) => {
  state.background = event.target.value
  updateColorLabel('background', state.background)
  render()
})

document.querySelector('#icon-input').addEventListener('change', (event) => {
  const [file] = event.target.files
  if (!file) return
  state.iconName = file.name
  document.querySelector('#icon-name').textContent = file.name
  clearIcon.disabled = false
  const image = new Image()
  image.onload = () => {
    state.icon = image
    render()
  }
  image.src = URL.createObjectURL(file)
})

clearIcon.addEventListener('click', () => {
  state.icon = null
  state.iconName = ''
  document.querySelector('#icon-name').textContent = '未选择'
  document.querySelector('#icon-input').value = ''
  clearIcon.disabled = true
  render()
})

document.querySelector('#download-button').addEventListener('click', downloadQr)
render()
