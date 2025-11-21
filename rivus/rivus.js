import {getElementPosition, getViewportPosition, parsePosition} from './helpers.js'

export default class Rivus {
	constructor(element) {
		this.el = element

		// 파싱된 옵션 저장
		this.options = {
			start: parsePosition(element.dataset.rivusStart),
			end: parsePosition(element.dataset.rivusEnd),
			...this.parseOptions()
		}

		this.startScrollY = 0 // 스크롤이 시작되는 Y (progress 계산)
		this.endScrollY = 0 // 스크롤이 끝나는 Y (progress 계산)
		this.entered = false // 진입했는지 확인

		this.onScroll = this.onScroll.bind(this)
		this.computeProgress = this.computeProgress.bind(this)

		this.init()
	}

	parseOptions() {
		const options = this.el.dataset.rivusOptions
		return options ? JSON.parse(options) : {}
	}

	computeProgress() {
		const rect = this.el.getBoundingClientRect()

		const elementStart = getElementPosition(rect, this.options.start.element)
		const elementEnd = getElementPosition(rect, this.options.end.element)

		const viewportStart = getViewportPosition(this.options.start.viewport)
		const viewportEnd = getViewportPosition(this.options.end.viewport)

		this.startScrollY = elementStart - viewportStart
		this.endScrollY = elementEnd - viewportEnd
	}

	onScroll() {
		const scrollY = window.scrollY

		// 진입
		if (!this.entered && scrollY >= this.startScrollY && scrollY <= this.endScrollY) {
			this.entered = true
			this.el.dataset.rivusEnter = 'true'
		}

		// 이탈
		if (this.entered && (scrollY < this.startScrollY || scrollY > this.endScrollY)) {
			this.entered = false
			this.el.dataset.rivusEnter = 'false'
		}

		// progress 계산
		const progress = (scrollY - this.startScrollY) / (this.endScrollY - this.startScrollY)
		const clamped = Math.min(1, Math.max(0, progress))

		this.el.dataset.rivusProgress = clamped
	}

	init() {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					// 진입 시
					this.computeProgress() // progress 계산
					this.onScroll()
					window.addEventListener('scroll', this.onScroll, {passive: true})
				} else {
					window.removeEventListener('scroll', this.onScroll)
				}
			})
		})

		observer.observe(this.el)
	}
}
